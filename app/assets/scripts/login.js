$( document ).ready( () => {
    $("#bt-signin").click((e)=>{
        let email = $("#email").val();
        let password = $("#password", $("#loginform")).val();
        $.ajax({
        "async": true,
        "crossDomain": true,
        "url": "logon",
        "method": "POST",
        "headers": {
            "Content-Type": "application/x-www-form-urlencoded",
            "cache-control": "no-cache"
        },
        "data": {"email": email,"password": password}
        }).done( (res) => {
            if (res.code == "OK") {
                $(location).attr('href', 'home');
            } else {
                $("#alert-danger").attr("class", "alert alert-danger");
                $("#message-error").text(res.message);
            }
        }).fail( (res) => {
           throw res.message
        })

    });
});
