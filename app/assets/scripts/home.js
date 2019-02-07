$( document ).ready( function() {
    
    var report;
    var size = 8; 
    $.ajax({
        type: "get",
        url: "/report",
        success: function(data) {
            report = data;
            loadData(data,0,size)
        }
    })

    $("#log-off").click( function(e) {        
        $.ajax({
            type: "get",
            url: "/logoff",
            success: function (res) {
                if (res.code == "OK") {
                    $(location).attr('href', '/'); 
                }
            }
        });
    });

    function loadData(data, skip,take) { 
        $("#main-container").empty();
        data.slice(skip,take).forEach(function(res) {
            
            var divCard = $('<div>',
                            {id: "div-card",
                             class : "card sticky-top" });
            var divCardHeader =  $('<div>',
                                    {"id": "div-card-header-" + res.Codigo, 
                                    "class" : "card-header collapsed row pl-2 pr-2 mr-1 ml-1", 
                                    "data-toggle":"collapse", 
                                    "data-target" : "#collapse" + res.Codigo,
                                    "aria-expanded" : "false",
                                     "aria-controls" : "collapse" + res.Codigo});


            var dtNome = $("<dt>", {class: "col-lg-5 text-dark"}).text(res.Nome);
            var ddCnpj = $("<dt>", {class: "col-sm-4 text-muted"}).text("CNPJ: " + res.Cnpj);
            var arrowDropDown = $("<i>", {class:"material-icons float-right text-dark"}).text("arrow_drop_down")
            var divCardCollapse = $("<div>",
                                    {"id": "collapse" + res.Codigo,
                                    "class":"collapse",
                                    "aria-labelledby":"heading"+ res.Codigo,
                                    "data-parent":"#main-container"});
            var divCardBody = $("<div>",
                                {"class":"container card-body text-left"});
            var ulListGroup = $("<ul>" 
                                ,{"class":"list-group"});
            var liListGroupCodigo = $("<li>"
                                    , { class : "list-group-item d-flex justify-content-between align-items-center"})
                                    .text("ID:").append($("<b>", { class : ".text-primary"}).text(res.Codigo)); 
                                    
            var liListGroupProdutoComPreco = $("<li>"
                                    , { class : "list-group-item d-flex justify-content-between align-items-center"})
                                    .text("Produtos com preço:").append($("<span>", { class : "badge badge-primary badge-pill"}).text(res.Produtos_com_preco)); 

            var liListGroupProdutoSemPreco = $("<li>"
                                    , { class : "list-group-item d-flex justify-content-between align-items-center"})
                                    .text("Produtos sem preço:").append($("<span>", { class : "badge badge-primary badge-pill"}).text(res.Produtos_sem_preco)); 

            var liListGroupTotal = $("<li>"
                                , { class : "list-group-item d-flex justify-content-between align-items-center"})
                                .text("Total de produtos:")
                                .append($("<span>",
                                    {class : "badge badge-primary badge-pill"})
                                .text(res.Total)); 

            var liListGroupRepetidos = $("<li>"
                                        , { class : "list-group-item d-flex justify-content-between align-items-center"})
                                        .text("Produtos repetidos:").append($("<span>"
                                                                                , { id : "duplicate-" + res.Codigo,
                                                                                    class : "badge badge-danger badge-pill"}).text(res.Produtos_repetidos)); 
            
            var buttonDeletarRepetidos = $("<button>", { class: "material-icons badge badge-danger badge-pill"}).text("delete")
            buttonDeletarRepetidos.click( function (e) {
                $('#modal-duplicates').modal('show')
                $.ajax({
                    type: "delete",
                    url: "/delete-duplicates"+ '?' + $.param({"Id": res.Codigo}),
                    data: { "id": res.Codigo },
                    success: function (result) {
                        if (result.code == "OK") {  
                            $("#modal-duplicates-content").empty()
                            $("#modal-duplicates-content").append($("<b>").text(result.message))
                            $("#duplicate-" + res.Codigo).text(0);
                            $("#li-duplicate"+ res.Codigo).remove();
                        }
                    }
                })
            });

            var liDeletarRepetidos = $("<li>"
                                        , { id : "li-duplicate" + res.Codigo,
                                            class : "list-group-item d-flex justify-content-between align-items-center"})
                                        .text("Deletar repetidos:").append(buttonDeletarRepetidos);

            $("#main-container").append(divCard);
            divCard.append(divCardHeader);
            divCardHeader.append(dtNome);
            divCardHeader.append(ddCnpj);
            dtNome.append(arrowDropDown);

            divCard.append(divCardCollapse)
            divCardCollapse.append(divCardBody)
            
            divCardBody.append(ulListGroup)           
            
            ulListGroup.append(liListGroupCodigo)
            ulListGroup.append(liListGroupProdutoComPreco)
            ulListGroup.append(liListGroupProdutoSemPreco)
            ulListGroup.append(liListGroupTotal)
            ulListGroup.append(liListGroupRepetidos)
            if (res.Produtos_repetidos > 0) {
                ulListGroup.append(liDeletarRepetidos)
            }
        });
        var divNavFooter = $("<div>", { class : "bg-transparent fixed-botton d-flex col-12 mt-3"})
        var ulPages = $("<ul>", { id: "ul-pages", class : "bg-transparent list-inline mx-auto justify-content-center text-light"})
       
        $("#main-container").append(divNavFooter);
        divNavFooter.append(ulPages)
        var pages =(report.length/size);        
        pages = Math.ceil(pages)
        for (var index = 0; index < pages; index++) {
            var button = $("<button>", { id : "pagelink", class : "bg-transparent text-light" }).text(index+1);
            button.click(function (e) {
                skip = index * size;
                take = skip + size;
                loadData(report,skip,take);
            });
            var li = $("<li>", {class:"list-inline-item bg-transparent"}).append(button)
            $("#ul-pages").append(li)
        }

     }

})