function startApp() {
    //app constants
    const appKey = 'kid_B1BdCPhVQ';
    const appSecret = '31adeb0b329a4dff959d2ba9f75a6b96';
    const baseUrl = 'https://baas.kinvey.com/';

    //initial app start
    showLinks();
    showView("viewHome");

    //automatic  header maker
    function headersMaker(type) {
        if (type === "basic") {
            return {
                "Authorization": "Basic " + btoa(`${appKey}:${appSecret}`),
                "Content-Type": "application/json"
            };
        } else if (type === 'kinvey') {
            return {
                "Authorization": "Kinvey " + sessionStorage.getItem('authtoken'),
                "Content-Type": "application/json"
            };
        }
    }

    //show different views
    function showView(view, form) {
        $('main > section').hide();
        $(`#${view}`).show();
        if (form !== undefined)
            $(`#${form}`).trigger('reset');
    }

    //showing buttons depending on the user
    function showLinks() {
        $("#linkHome").show();
        if (sessionStorage.getItem("authtoken") == null) {
            $("#linkLogin").show();
            $("#linkRegister").show();
            $("#linkCreateAd").hide();
            $("#linkListAds").hide();
            $("#linkLogout").hide();
            $("#loggedInUser").hide();
        } else {
            $("#linkLogin").hide();
            $("#linkRegister").hide();
            $("#linkCreateAd").show();
            $("#linkListAds").show();
            $("#linkLogout").show();
            $('#loggedInUser').text("Welcome, " + sessionStorage.getItem('publisher') + "!");
            $("#loggedInUser").show();
        }
    }

    //binding event handlers
    $("#linkHome").click(() => {
        showView("viewHome");
    });
    $("#linkLogin").click(() => {
        showView("viewLogin", "formLogin");
    });
    $("#linkRegister").click(() => {
        showView("viewRegister", "formRegister");
    });
    $("#linkCreateAd").click(() => {
        showView("viewCreateAd", "formCreateAd");
    });
    $("#linkListAds").click(() => {
        showView("viewAds");
        loadAds()
    });
    $("#linkLogout").click(logout);


    $("#buttonRegisterUser").click(registerUser);
    $("#buttonLoginUser").click(loginUser);
    $("#buttonCreateAd").click(create);
    $("#buttonDeleteAd").click(create);
    $("#buttonEditAd").click(editAd);

    $('#infoBox, #errorBox').click(function () {
        $(this).fadeOut();
    });
    $(document).on({
        ajaxStart: function () {
            $("#loadingBox").show()
        },
        ajaxStop: function () {
            $("#loadingBox").hide()
        }
    });

    //user- login/logout/register
    //saving users authtoken
    function saveUsersInfo(user) {
        sessionStorage.setItem("authtoken", user._kmd.authtoken);
        sessionStorage.setItem("publisher", user.username);
        sessionStorage.setItem("publisherId", user._id);
    }

    //register
    function registerUser() {
        let username = $("#formRegister input[name=username]").val();
        let passwd = $("#formRegister input[name=passwd]").val();

        if(username.length ==0){
            displayError("Username cannot be blank.");
            return
        }
        if(passwd.length ===0){
            displayError("Password cannot be blank.");
            return
        }

        let user = JSON.stringify({username: username, password: passwd});
        let req = {
            url: baseUrl + `user/${appKey}/`,
            method: "POST",
            headers: headersMaker("basic"),
            data: user,
            success: registerSuccess,
            error: (e) => displayError(e.responseJSON.description)
        };
        $.ajax(req);

        function registerSuccess(user) {
            saveUsersInfo(user);
            showView("viewHome");
            showLinks();
            showInfo("Register successful.")
        }
    }

    //login
    function loginUser() {
        let username = $("#formLogin input[name=username]").val();
        let passwd = $("#formLogin input[name=passwd]").val();

        if(username.length ==0){
            displayError("Username cannot be blank.");
            return
        }
        if(passwd.length ===0){
            displayError("Password cannot be blank.");
            return
        }

        let user = JSON.stringify({username: username, password: passwd});
        let req = {
            url: baseUrl + `user/${appKey}/login`,
            method: "POST",
            headers: headersMaker("basic"),
            data: user,
            success: loginSuccess,
            error: (e) => displayError(e.responseJSON.description)
        };
        $.ajax(req);

        function loginSuccess(user) {
            saveUsersInfo(user);
            showView("viewHome");
            showLinks();
            showInfo("Login successful.")
        }
    }

    //logout
    function logout() {
        let req = {
            url: baseUrl + `user/${appKey}/_logout`,
            method: "POST",
            headers: headersMaker("kinvey"),
            success: logoutSuccess,
            error: (e) => displayError(e.responseJSON.description)
        };
        $.ajax(req);

        function logoutSuccess(response) {
            sessionStorage.clear();
            showView("viewHome");
            showLinks();
            showInfo("Logout successful.")
        }
    }

    //ads - creation, edit, delete, view more
    //load ads
    function loadAds() {
        showView("viewAds");
        let table = $("#ads table");
        table.find('tr').each((i, e) => {
            if (i > 0) {
                $(e).remove();
            }
        });
        let req = {
            url: baseUrl + `appdata/${appKey}/ads`,
            headers: headersMaker("kinvey"),
            success: displayAds,
            error: (e) => {
                displayError(e.responseJSON.description)
            }
        };
        $.ajax(req);

        function displayAds(ads) {
            let adsSelector = $("#ads");
            if(ads.length ===0){
                adsSelector.text('No books in the library.');
            }else{
                adsSelector.empty();
                adsSelector.append($("<table>")
                    .append($("<tr>")
                        .append("<th>Title</th><th>Publisher</th><th>Description</th><th>Price</th><th>Date Published</th><th>Actions</th>")))
            }
            let table = adsSelector.find("table");
            for (let ad of ads) {
                let actions = [];
                if (ad._acl.creator === sessionStorage.getItem("publisherId")) {
                    actions.push($("<a href='#'>[Edit]</a>").click(() => {
                        loadAdforEdit(ad);
                        showView("viewEditAd")
                    }));
                    actions.push($("<a href='#'>[Delete]</a>").click(() => {
                        deleteAd(ad)
                    }));
                }
                actions.push($("<a href='#'>[Read More]</a>").click(() => {
                    readMore(ad);
                    showView('viewAdDetails');
                }));
                let adTr = $('<tr>')
                    .append(`<td>${ad.title}</td>`)
                    .append(`<td>${ad.publisher}</td>`)
                    .append(`<td>${ad.description}</td>`)
                    .append(`<td>${ad.price}</td>`)
                    .append(`<td>${ad.dateOfPublishing}</td>`)
                    .append($('<td>').append(actions))
                adTr.appendTo(table);
            }
        }
    }

    //edit ads
    function loadAdforEdit(ad) {
        $('#formEditAd input[name=id]').val(ad._id);
        $('#formEditAd input[name=publisher]').val(ad.publisher);
        $('#formEditAd input[name=title]').val(ad.title);
        $('#formEditAd textarea[name=description]').val(ad.description);
        $('#formEditAd input[name=datePublished]').val(ad.dateOfPublishing);
        $('#formEditAd input[name=price]').val(ad.price);
        $('#formEditAd input[name=image]').val(ad.image);
    }

    function editAd() {
        let publisher = $("#formEditAd input[name=publisher]").val();
        let title = $("#formEditAd input[name=title]").val();
        let description = $("#formEditAd textarea[name=description]").val();
        let date = $("#formEditAd").find(`[name='datePublished']`).val();
        let price = Number(Number($("#formEditAd input[name=price]").val()).toFixed(2));
        let id = $("#formEditAd input[name=id]").val();
        let img = $("#formEditAd input[name=image]").val();

        if(title.length ==0){
            displayError("Title cannot be blank.");
            return
        }
        if(description.length ===0){
            displayError("Description cannot be blank.");
            return
        }
        if(date.length == 0){
            displayError("Enter a valid date.");
            return
        }
        if(price < 0){
            displayError("Enter a valid price.");
            return
        }
        if(img.length ==0){
            displayError("Provide a valid image source.");
            return
        }


        let ad = JSON.stringify({
            title: title,
            description: description,
            dateOfPublishing: date,
            price: price,
            publisher: sessionStorage.getItem("publisher"),
            image: img
        });
        let req = {
            url: baseUrl + `appdata/${appKey}/ads/${id}`,
            method: "PUT",
            headers: headersMaker("kinvey"),
            data: ad,
            success: advertiseSuccess,
            error: (e) => displayError(e.responseJSON.description)
        };
        $.ajax(req);

        function advertiseSuccess(ad) {
            loadAds();
            showLinks();
            showInfo("Ad edited successfully.")
        }
    }

    //delete ads
    function deleteAd(ad) {
        let req = {
            url: baseUrl + `appdata/${appKey}/ads/${ad._id}`,
            method: "DELETE",
            headers: headersMaker('kinvey'),
            success: deleteSuccess,
            error: displayError
        };
        $.ajax(req);

        function deleteSuccess(data) {
            loadAds();
            showLinks();
            showInfo("Ad deleted successfully.")
        }
    }

    //read more about ads
    function readMore(ad) {
        $("#viewAdDetails").empty();
        let advertInfo = $("<div>")
            .append(
                $('<img>').attr('src', ad.image),
                $("br"),
                $(`<label>Title: </label>`),
                $(`<h1>${ad.title}</h1>`),
                $(`<label>Description: </label>`),
                $(`<p>${ad.description}</p>`),
                $(`<label>Publisher: </label>`),
                $(`<div>${ad.publisher}</div>`),
                $(`<label>Date :</label>`),
                $(`<div>${ad.dateOfPublishing}</div>`),
            );
        $("#viewAdDetails").append(advertInfo);
    }

    //create ad
    function create() {
        let title = $("#formCreateAd input[name=title]").val();
        let description = $("#formCreateAd textarea[name=description]").val();
        let date = $("#formCreateAd").find(`[name='datePublished']`).val();
        let price = Number(Number($("#formCreateAd input[name=price]").val()).toFixed(2));
        let img = $("#formCreateAd input[name=image]").val();

        if(title.length ==0){
            displayError("Title cannot be blank.");
            return
        }
        if(description.length ===0){
            displayError("Description cannot be blank.");
            return
        }
        if(date.length == 0){
            displayError("Enter a valid date.");
            return
        }
        if(price < 0){
            displayError("Enter a valid price.");
            return
        }
        if(img.length ==0){
            displayError("Provide a valid image source.");
            return
        }


        let ad = JSON.stringify({
            title: title,
            description: description,
            dateOfPublishing: date,
            price: price,
            publisher: sessionStorage.getItem("publisher"),
            image: img
        });
        let req = {
            url: baseUrl + `appdata/${appKey}/ads`,
            method: "POST",
            headers: headersMaker("kinvey"),
            data: ad,
            success: advertiseSuccess,
            error: (e) => displayError(e.responseJSON.description)
        };
        $.ajax(req);

        function advertiseSuccess(ad) {
            loadAds();
            showLinks();
            showInfo("Ad created successfully.")
        }
    }

    //showInfo
    function showInfo(info) {
        $("#loadingBox").hide();
        let infoBox = $("#infoBox");
        infoBox.text(info);
        infoBox.fadeIn();
        setInterval(() => {
            infoBox.fadeOut();
        }, 3000);
    }

    //hanfdleError
    function displayError(reason) {
        $("#loadingBox").hide();
        let errorBox = $("#errorBox");
        errorBox.text("Error: " + reason);
        errorBox.fadeIn();
        errorBox.click(() => {
            errorBox.fadeOut();
        });
    }
}