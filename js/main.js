$(document).ready(function () {
    var dashboardSampleCookies = {
        getItem: function (sKey) {
          if (!sKey) { return null; }
          return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
        },
        setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
          if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
          var sExpires = "";
          if (vEnd) {
            switch (vEnd.constructor) {
              case Number:
                sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
                break;
              case String:
                sExpires = "; expires=" + vEnd;
                break;
              case Date:
                sExpires = "; expires=" + vEnd.toUTCString();
                break;
            }
          }
          document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
          return true;
        },
        removeItem: function (sKey, sPath, sDomain) {
          if (!this.hasItem(sKey)) { return false; }
          document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "");
          return true;
        },
        hasItem: function (sKey) {
          if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
          return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
        },
        keys: function () {
          var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
          for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
          return aKeys;
        }
    };

    $('body').on('keyup change keypress', 'input,textarea', function () {
        var submit = $('#submitLogin')
        if ($('input#appCode').val() != '' && $('input#secreetKey').val() != '') {
            submit.removeClass('disable')
        } else {
            submit.addClass('disable')
        }
    })
    $('body').on('click', '#submitLogin', function () {
        dashboardSampleCookies.setItem('APP_ID', $('#appCode').val(), 31556926);
        dashboardSampleCookies.setItem('SECRET_KEY', $('#secreetKey').val(), 31556926);
        setTimeout(function () {
            location.reload()
        }, 1000);
    })
    var page = 1
        itemsPerPage = 10
        avatar = $('#avatar')
        app_code = dashboardSampleCookies.getItem('APP_ID')
        secreet_key = dashboardSampleCookies.getItem('SECRET_KEY')
        baseUrl = 'https://'+ app_code +'.qiscus.com'
        secretKey = secreet_key
        users = []

    getUsers = {
        getDataFromApi: function (page) {
            var url = baseUrl + '/api/v2.1/rest/get_user_list';
            $("<div class='box-loading'><span class='icon-loading'></span> LOADING</div>").appendTo( ('.box-table') );

            $.ajax({
                url: url,
                type: 'get',
                data: {
                    limit: itemsPerPage,
                    page: page
                },
                headers: {
                    QISCUS_SDK_SECRET: secretKey,
                    'Content-Type':'application/x-www-form-urlencoded'
                },
                dataType: 'json',
                success: function (response) {
                    users = response.results.users;
                    $('table > tbody').empty();
                    $('.box-loading').remove();
                    if ($(".box-title > h3 > .total-user").children().length > 0) {
                        $(".box-title > h3 > .total-user").empty();
                    }
                    listingData(response, page);
                }
            })
        }
    };

    getUsers.getDataFromApi(page);

    function listingData(data, page) {
        if ($("table > tbody").children().length > 0) {
            $("table > tbody").empty();
        }
        if (data.results.users.length > 0) {
            $("<span> ("+ data.results.meta.total_data +")</span>").appendTo( ('.box-title > h3 > .total-user') );
            $.each(data.results.users, function (index, val) {
                var key = ((page - 1) * itemsPerPage) + (index + 1);
                    username = val.username ? val.username : '-'
                    createDate = DateFormat.format.date(val.created_at, 'dd/MM/yyyy HH:mm:ss')
                    updateDate = DateFormat.format.date(val.updated_at, 'dd/MM/yyyy HH:mm:ss')
                $("<tr data-name="+ username +" data-email="+ val.email +" data-create-date="+ val.created_at +" data-update-date="+ val.updated_at +" data-value="+ val.id +"><th class='text-center' scope='row'>" + key + "</th><td><img style='margin-right: 10px;' class='img-circle' width='48' height='48' src=" + val.avatar_url + ">" + val.email + "</td><td>" + createDate + "</td><td>" + updateDate + "</td><td class='text-center'><a href='#' class='button-action button-update-user'><img src='img/ic_pencil.svg' width='18' height='18' alt='view'></a><a href='#' class='button-action button-view-user'><img src='img/ic_eye.svg' width='18' height='18' alt='view'></a></td></tr>").appendTo( ('tbody') );
            });
            $('#pagination').twbsPagination({
                totalPages: Math.ceil(data.results.meta.total_data / itemsPerPage),
                onPageClick: function (evt, page) {
                    getUsers.getDataFromApi(page);
                }
            });
        } else {
            $("<tr></tr><tr><td colspan='5' class='text-center'><div class='icon-empty-user'></div><div class='info-empty'>User Data Not Found</div><div class='instruction-empty'>You can add user to use it on your app that using Qiscus SDK</div><div><button type='button' class='btn btn-default' data-toggle='modal' data-target='#createUserModal'><span class='icon-user'></span> Add User </button></div></td></tr>").appendTo( ('tbody') );
        }
    }

    /**
     * check form input
     */
    var checkForm = function() {
        return $('input,textarea').on('keyup change keypress', function () {
            var send        = $('#buttonCreateUser')
            if ($('input#email').val() != '' && $('input#password').val() != '') {
                send.removeClass('disable')
            } else {
                send.addClass('disable')
            }
        })
    };

    /**
     * create new user
     */
    $('body').on('click', '#buttonCreate', function (e) {
        var inputElem = $('<div class="form-group"><label for="email">User ID / Display Name</label><input type="email" class="form-control" id="email" placeholder="User ID / Display Name"></div><div class="form-group"><label for="password">Password</label><input type="password" class="form-control" id="password" placeholder="Password"></div>');
            btnCreate = $('<button id="buttonCreateUser" type="button" class="btn btn-default disable"><span class="icon-user"></span> Add User</button>')
        $('#myModalLabel').empty();
        $('#myModalLabel').append('Create User');
        $('#avatar').attr('src', 'img/ic_default_avatar.svg');
        $('#avatar_url').closest('.box-input-foto').find('label').empty();
        $('#avatar_url').closest('.box-input-foto').find('label').append('Upload Photo');
        $('.box-input').empty();
        $('.modal-footer').empty();
        inputElem.appendTo(('.box-input'));
        btnCreate.appendTo(('.modal-footer'));
        $.when( $('#createUserModal').modal('show') ).done(function() {
            checkForm();
        });
    });

    window.URL = window.URL || window.webkitURL;
    $('#avatar_url').on("change", function () {
        var files = $(this).prop('files');
        for (var i = 0; i < files.length; i++) {
            const date = new Date(files[i].lastModified);
            avatar.attr('src', window.URL.createObjectURL(files[i]));
            var info = "Size: " + files[i].size + " bytes";
            $('#sizeImg').empty();
            $('#sizeImg').append(info);
        }
    })

    $('body').on('click', '#buttonCreateUser', function () {
        var self = $('#buttonCreateUser');
        var userData = {
            email: $('#email').val() ? $('#email').val() : null,
            password: $('#password').val() ? $('#password').val() : null,
            username: $('#username').val() ? $('#username').val() : null,
            avatar_url: null
        }
        var file_data = $('#avatar_url').prop('files')[0] ? $('#avatar_url').prop('files')[0] : "";

        self.empty();
        self.css('background', '#F2994A');
        self.append("<span class='icon-loading icon-loading-white'></span> Creating User");
        self.addClass('disabled');
        if (file_data !== "") {
            var form_data = new FormData();
            form_data.append('file', file_data);
            form_data.append('token', "ZBuqIoiAVNb87vrZyrgg")
            $.ajax({
                url: '//dashboard-sample.herokuapp.com/api/upload',
                type: 'POST',
                dataType: 'json',
                contentType: false,
                processData: false,
                data: form_data,
                success: function (response) {
                    userData.avatar_url = response.results.file.url;
                    loginOrRegister(userData);
                },
                error: function (error) {
                    console.log(error);
                }
            })
        } else {
            loginOrRegister(userData);
        }
    });

    function loginOrRegister(userData) {
        $.ajax({
            url: baseUrl + '/api/v2/rest/login_or_register',
            method: 'POST',
            type: 'POST',
            data: {
                email: userData.email,
                password: userData.password,
                username: userData.username,
                avatar_url: userData.avatar_url
            },
            headers: {
                QISCUS_SDK_SECRET: secretKey,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            dataType: 'json',
            success: function (response) {
                $('#createUserModal').modal('hide')
                setTimeout(function () {
                    location.reload()
                }, 1000);
            },
            error: function (error) {
                console.log(error);
                self.empty();
                self.append('Add User')
                self.css('background', '#2ACB6E');
            }
        })
    }

    /**
     * view user
     */
    $('body').on('click', '.button-view-user', function (e) {
        console.log($(this).closest('tr').data("options"));
        var name = $(this).closest('tr').data("name")
            email = $(this).closest('tr').data("email")
            createDate = DateFormat.format.date($(this).closest('tr').data("createDate"), 'dd/MM/yyyy')
            createTime = DateFormat.format.date($(this).closest('tr').data("createDate"), 'HH:mm:ss')
            updateDate = DateFormat.format.date($(this).closest('tr').data("updateDate"), 'dd/MM/yyyy')
            updateTime = DateFormat.format.date($(this).closest('tr').data("updateDate"), 'HH:mm:ss')
            inputElem = $('<div class="form-group"><label>Display Name</label><div>' + name + '</div></div><div class="form-group"><label>User ID</label><div>' + email + '</div></div><div class="form-group"><label>Created At</label><div>' + createDate + ' at ' + createTime + '</div></div><div class="form-group"><label>Updated At</label><div>' + updateDate + ' at ' + updateTime + '</div></div>');
            btnClose = $('<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>')
        $('#myModalLabel').empty();
        $('#myModalLabel').append('View User');
        $('#avatar').attr('src', $(this).closest('tr').find('img.img-circle').attr('src'));
        $('#avatar_url').closest('.box-input-foto').find('label').empty();
        $('.box-input').empty();
        $('.modal-footer').empty();
        inputElem.appendTo(('.box-input'));
        btnClose.appendTo(('.modal-footer'));
        $('#createUserModal').modal();
    })

    /**
     * update user
     */
    $('body').on('click', '.button-update-user', function (e) {
        var name = $(this).closest('tr').data("name")
            email = $(this).closest('tr').data("email")
            inputElem = $('<div class="form-group"><label for="email">User ID</label><input type="email" class="form-control" id="email" value='+ email +' placeholder="User ID"></div><div class="form-group"><label for="username">Display Name</label><input type="text" class="form-control" id="username" value='+ name +' placeholder="username"></div><div class="form-group"><label for="password">Password</label><input type="password" class="form-control" id="password" placeholder="Password"></div>');
            btnUpdate = $('<button id="buttonCreateUser" type="button" class="btn btn-default disable"><span class="icon-user"></span> Update User</button>')
        $('#myModalLabel').empty();
        $('#myModalLabel').append('Update User');
        $('#avatar').attr('src', $(this).closest('tr').find('img.img-circle').attr('src'));
        $('#avatar_url').closest('.box-input-foto').find('label').empty();
        $('#avatar_url').closest('.box-input-foto').find('label').append('Upload Photo');
        $('.box-input').empty();
        $('.modal-footer').empty();
        inputElem.appendTo(('.box-input'));
        btnUpdate.appendTo(('.modal-footer'));
        $.when( $('#createUserModal').modal('show') ).done(function() {
            checkForm();
        });
    });

    $('body').on('click', '#buttonLogout', function () {
        dashboardSampleCookies.removeItem('APP_ID');
        dashboardSampleCookies.removeItem('SECRET_KEY');
        location.reload();
    })
})