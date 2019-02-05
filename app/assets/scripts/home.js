$( document ).ready( () => {
    
    var report;
    const size = 8; 
    $.ajax({
        type: "get",
        url: "/report",
        success: (data) => {
            report = data;
            loadData(data,0,size)
        }
    })

    $("#log-off").click((e) =>{        
        $.ajax({
            type: "get",
            url: "/logoff",
            success: (res) => {
                if (res.code == "OK") {
                    $(location).attr('href', '/'); 
                }
            }
        });
    });

    function loadData(data, skip,take) { 
        $("#main-container").empty();
        data.slice(skip,take).forEach(res => {
            let divCard = $('<div>',
                            {id: "div-card",
                             class : "card sticky-top" });
            let divCardHeader =  $('<div>',
                                    {"id": "div-card-header-" + res.Codigo, 
                                    "class" : "card-header collapsed row pl-2 pr-2 mr-1 ml-1", 
                                    "data-toggle":"collapse", 
                                    "data-target" : "#collapse" + res.Codigo,
                                    "aria-expanded" : "false",
                                     "aria-controls" : "collapse" + res.Codigo});


            let dtNome = $("<dt>", {class: "col-lg-5 text-dark"}).text(res.Nome);
            let ddCnpj = $("<dt>", {class: "col-sm-4 text-muted"}).text("CNPJ: " + res.Cnpj);
            let arrowDropDown = $("<i>", {class:"material-icons float-right text-dark"}).text("arrow_drop_down")
            let divCardCollapse = $("<div>",
                                    {"id": "collapse" + res.Codigo,
                                    "class":"collapse",
                                    "aria-labelledby":"heading"+ res.Codigo,
                                    "data-parent":"#main-container"});
            let divCardBody = $("<div>",
                                {"class":"container card-body text-left"});
            let ulListGroup = $("<ul>" 
                                ,{"class":"list-group"});
            let liListGroupCodigo = $("<li>"
                                    , { class : "list-group-item d-flex justify-content-between align-items-center"})
                                    .text("ID:").append($("<b>", { class : ".text-primary"}).text(res.Codigo)); 
                                    
            let liListGroupProdutoComPreco = $("<li>"
                                    , { class : "list-group-item d-flex justify-content-between align-items-center"})
                                    .text("Produtos com preço:").append($("<span>", { class : "badge badge-primary badge-pill"}).text(res.Produtos_com_preco)); 

            let liListGroupProdutoSemPreco = $("<li>"
                                    , { class : "list-group-item d-flex justify-content-between align-items-center"})
                                    .text("Produtos sem preço:").append($("<span>", { class : "badge badge-primary badge-pill"}).text(res.Produtos_sem_preco)); 

            let liListGroupTotal = $("<li>"
                                , { class : "list-group-item d-flex justify-content-between align-items-center"})
                                .text("Total de produtos:")
                                .append($("<span>",
                                    {class : "badge badge-primary badge-pill"})
                                .text(res.Total)); 

            let liListGroupRepetidos = $("<li>"
                                        , { class : "list-group-item d-flex justify-content-between align-items-center"})
                                        .text("Produtos repetidos:").append($("<span>"
                                                                                , { id : "duplicate-" + res.Codigo,
                                                                                    class : "badge badge-danger badge-pill"}).text(res.Produtos_repetidos)); 
            
            let buttonDeletarRepetidos = $("<button>", { class: "material-icons badge badge-danger badge-pill"}).text("delete")
            buttonDeletarRepetidos.click((e) => {
                $('#modal-duplicates').modal('show')
                $.ajax({
                    type: "delete",
                    url: "/delete-duplicates"+ '?' + $.param({"Id": res.Codigo}),
                    data: { "id": res.Codigo },
                    success: result => {
                        if (result.code == "OK") {  
                            $("#modal-duplicates-content").empty()
                            $("#modal-duplicates-content").append($("<b>").text(result.message))
                            $("#duplicate-" + res.Codigo).text(0);
                            $("#li-duplicate"+ res.Codigo).remove();
                        }
                    }
                })
            });

            let liDeletarRepetidos = $("<li>"
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
        let divNavFooter = $("<div>", { class : "bg-transparent fixed-botton d-flex col-12 mt-3"})
        let ulPages = $("<ul>", { id: "ul-pages", class : "bg-transparent list-inline mx-auto justify-content-center text-light"})
       
        $("#main-container").append(divNavFooter);
        divNavFooter.append(ulPages)
        let pages =(report.length/size);        
        pages = Math.ceil(pages)
        for (let index = 0; index < pages; index++) {
            let button = $("<button>", { id : "pagelink", class : "bg-transparent text-light" }).text(index+1);
            button.click((e) => {
                skip = index * size;
                take = skip + size;
                loadData(report,skip,take);
            });
            let li = $("<li>", {class:"list-inline-item bg-transparent"}).append(button)
            $("#ul-pages").append(li)
        }

     }

})