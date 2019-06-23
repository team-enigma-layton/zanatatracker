$('#submit').click(function() {
    if(!checkValues()) return false;
    var tu = v('targetUsername');
    var date = v('date');
    $('.loading').removeClass("d-none");
    $('.loading').addClass("d-flex");
    $('.please-query').addClass("d-none");
    if(tu.length > 1) {
        var dataArray = new Array();
        var userSize = tu.length;
        $.each(tu, function(_, u) {
            var url = v('url') + 'rest/stats/project/' + v('projectName') + '/version/' + v('versionName') + '/contributor/' + u + '/' + v('date');
            $.ajax({
                url: url,
                headers: {
                    'Accept': 'application/json',
                    'X-Auth-User': v('username'),
                    'X-Auth-Token': v('userToken'),
                    'Content-Type': 'application/json'
                },
                xhrFields: {
                    withCredentials: true
                },
                data: {
                    locale: v('locale'),
                    word: v('word')
                },
                dataType: 'json',
                contentType: 'application/json',
                success: function(data, status, _) {
                    dataArray.push(data);
                },
                error: function(data, status, _) {
                    console.log('Unexpected Error, code:' + data.status + ', message:' + data.responseText);
                    switch(data.status) {
                        case 0:
                            $('#CORSExtModal').modal('show');
                            break;
                        case 404:
                            $('#404').show();
                            break;
                        case 500:
                            $('#500').show();
                            break;
                    }
                    userSize--;
                },
                complete: function() {
                    if(dataArray.length == userSize && userSize > 0) {
                        $('.loading').removeClass("d-flex");
                        $('.loading').addClass("d-none");
                        updateUserStatics(dataArray);
                    }
                }
            })
        });
    } else {
        if(date == '--..--') {
            var url = v('url') + 'rest/stats/proj/' + v('projectName') + '/iter/' + v('versionName');
        } else {
            var url = v('url') + 'rest/stats/project/' + v('projectName') + '/version/' + v('versionName') + '/' + v('date');
        }
        $.ajax({
            url: url,
            headers: {
                'Accept': 'application/json',
                'X-Auth-User': v('username'),
                'X-Auth-Token': v('userToken'),
                'Content-Type': 'application/json'
            },
            xhrFields: {
                withCredentials: true
            },
            data: {
                locale: v('locale'),
                detail: true,
                word: v('word')
            },
            dataType: 'json',
            contentType: 'application/json',
            success: function(data, status, _) {
                $('.loading').removeClass("d-flex");
                $('.loading').addClass("d-none");
                if(date =='--..--') {
                    updateVersionStatics(data);
                } else {
                    updateVersionDateStatics(data);
                }
                
            },
            error: function(data, status, _) {
                console.log('Unexpected Error, code:' + data.status + ', message:' + data.responseText);
                switch(data.status) {
                    case 0:
                        $('#CORSExtModal').modal('show');
                        break;
                    case 404:
                        $('#404').fadeIn(200);
                        break;
                    case 500:
                        $('#500').fadeIn(200);
                        break;
                }
            }
        })
    }
    
})

$('#close-404').on('click', function() {
    $('#404').fadeOut(200);
})

$('#close-500').on('click', function() {
    $('#500').fadeOut(200);
})

function updateUserStatics(data) {

}

function updateVersionStatics(data) {

}

function updateVersionDateStatics(data) {

}

function checkValues() {
    var check = true;
    var required = [ 'username', 'userToken', 'projectName', 'versionName' ]
    $.each(required, function(_, r) {
        if($('#' + r).val() == '') {
            check = false;
            $("label[for='" + r + "']").addClass('text-danger');
            $('#' + r).addClass('is-invalid');
            $('#' + r).popover({
                trigger: 'focus',
                placement: 'bottom',
                content: '필수 항목입니다.'
            });
            $('#' + r).popover('show');
        }
    });
    if($('#zanataURL').val() != '' && !$('#zanataURL').val().startsWith("http")) {
        $("label[for='zanataURL']").addClass('text-danger');
        $('#zanataURL').addClass('is-invalid');
        $('#zanataURL').popover({
            trigger: 'focus',
            placement: 'bottom',
            content: '올바른 URL을 입력하세요.'
        })
        $('#zanataURL').popover('show');
        check = false;
    }
    dateInputed = false;
    notInputed = new Array();
    var dates = [ 'startYear', 'startMonth', 'startDay', 'endYear', 'endMonth', 'endDay' ]
    $.each(dates, function(_, r) {
        if($('#' + r).val() != '') {
            dateInputed = true;
        } else {
            notInputed.push(r);
        }
    });
    if(dateInputed && notInputed.length != 0) {
        $("label[for='date']").addClass('text-danger');
        $.each(notInputed, function(_, r) {
            $('#' + r).addClass('is-invalid');
            $('#' + r).popover({
                trigger: 'focus',
                placement: 'bottom',
                content: '모든 날짜는 입력되어야 합니다.'
            });
            $('#' + r).popover('show');
        });
        check = false;
    }
    if(dateInputed && $('#targetUsername').val() != '') {
        $("label[for='targetUsername']").addClass('text-danger');
        $('#targetUsername').addClass('is-invalid');
        $('#targetUsername').popover({
            trigger: 'focus',
            placement: 'bottom',
            content: '사용자 명이 입력되었을 경우 조회 기간을 반드시 입력하여야 합니다.'
        })
        $('#targetUsername').popover('show');
        check = false;
    }
    return check;
}

function v(name) {
    switch(name) {
        case 'url':
            var url = $('#zanataURL').val();
            if(url == '') url = 'http://translate.zanata.org/';
            if(!url.endsWith('/')) url.concat('/');
            return url;
        case 'date':
            return $('#startYear').val() + '-' + $('#startMonth').val() + '-' + $('#startDay').val()
                + '..' + $('#endYear').val() + '-' + $('#endMonth').val() + '-' + $('#endDay').val();
        case 'locale':
            var locale = $('#locale').val();
            if(locale == '') return 'ko';
            return locale;
        case 'targetUsername':
            return $('#targetUsername').val().split(',');
        case 'wordCheck':
            return $('#wordCheck').prop('checked');
        default:
            return $('#' + name).val();
    }
}