/* 
DOCUMENT ELEMENTS BEHAVIOR
*/

// ENABLE TOOLTIPS
$(function() {
    $('[data-toggle="tooltip"]').tooltip()
  })

$(document).ready(function() {  // or $(function()
    init();
});

var elements = ['zanataURL', 'username', 'userToken', 'projectName', 'versionName', 'locale', 'targetUserName']

function init() {
    $.each(elements, function (_, r) {
        $("#" + r).val(getCookie(r));
    });
}

$('#submit').click(function() {
    if(!checkValues()) return false;
    var tu = v('targetUsername');
    var date = v('date');
    $('.loading').removeClass("d-none");
    $('.loading').addClass("d-flex");
    $('.please-query').addClass("d-none");
    $('#contribution-info').removeClass("d-table");
    $('#contribution-info').addClass("d-none");
    $('#chart').addClass("d-none");
    $('#chart').removeClass("d-block");
    $('#graphtypediv').addClass("d-none");
    $('#graphtypediv').removeClass("d-flex");
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
                    'Content-Type': 'application/json',
                    'Access-Control-Request-Headers': 'x-requested-with'
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
                        case 401:
                            $('#401').fadeIn(200);
                            break;
                        case 404:
                            $('#404').fadeIn(200);
                            break;
                        case 500:
                            $('#500').fadeIn(200);
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
                'Content-Type': 'application/json',
                'Access-Control-Request-Headers': 'x-requested-with'
            },
            data: {
                locale: v('locale'),
                detail: true,
                word: v('word').toString()
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
                    case 401:
                        $('#401').fadeIn(200);
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

    //Save Cookies
    $.each(elements, function (_, r) {
        setCookie(r, v(r), 7);
    });
})

$('#close-404').on('click', function() {
    $('#404').fadeOut(200);
})

$('#close-401').on('click', function() {
    $('#401').fadeOut(200);
})

$('#close-500').on('click', function() {
    $('#500').fadeOut(200);
})

/*
    FUNCTIONS
*/

// Data cache for rebuilding graph view.
var data_cache = undefined;
var data_cache_type = undefined;
var chart_instance = null;


// Graph Type Enum
var GraphType = {
    PERCENTAGE: 0,
    NUMBERS: 1
}

var UnitType = {
    MESSAGE: 0,
    WORD: 1,
    properties : [ "MESSAGE", "WORD" ]
}

var UserStatType = {
    TRANSLATION: 0,
    REVIEW: 1
}

var DataType = {
    VERSION_GLOBAL: 0,
    VERSION_BY_DATE: 1,
    USERS: 2
}

var DateRangeType = {
    GLOBAL: 0,
    BY_DAY: 1,
    BY_WEEK: 2,
    BY_MONTH: 3
}

function updateGraph(graphType, unitType, dateRangeType) {
    if(chart_instance != null) chart_instance.destroy();
    var ctx = $('#chart');
    if(data_cache_type == DataType.VERSION_GLOBAL) {
        if(unitType == UnitType.MESSAGE) {
            var unitTypeString = "메시지";
        } else {
            var unitTypeString = "단어";
        }
        if(graphType == GraphType.PERCENTAGE) {
            var graphTypeString = "퍼센트";
        } else {
            var graphTypeString = "갯수";
        }
        new Chart(ctx, {
            type: 'horizontalBar',
            data: makeDataset(data_cache, data_cache_type, graphType, unitType, dateRangeType),
            options: {
                legend: { labels: { fontColor: 'white' } },
                title: { display: true, text: unitTypeString + " 기준 통계(" + graphTypeString + ")", fontColor: 'white' },
                tooltips: { mode: 'index', intersect: false },
                responsive: true,
                scales: { 
                    xAxes: [{
                        stacked: true, 
                        ticks: {
                            beginAtZero: true,
                            fontColor: 'white',
                            showLabelBackdrop: false
                        },
                        gridLines: {
                            color: 'rgba(255, 255, 255, 0.2)'
                        },
                        pointLabels: {
                            fontColor: 'white'
                        },
                        angleLines: {
                            color: 'white'
                        }
                    }],
                    yAxes: [{
                        stacked: true, 
                        ticks: {
                            beginAtZero: true,
                            fontColor: 'white',
                            showLabelBackdrop: false
                        },
                        gridLines: {
                            color: 'rgba(255, 255, 255, 0.2)'
                        },
                        pointLabels: {
                            fontColor: 'white'
                        },
                        angleLines: {
                            color: 'white'
                        }
                    }],
                }
            }
        });
    }
}

function makeDataset(data, dataType, graphType, unitType, dateRangeType) {
    if(dataType == DataType.VERSION_GLOBAL) {
        var labels = new Array();
        var needReview = new Array();
        var rejected = new Array();
        var approved = new Array();
        var translated = new Array();
        var untranslated = new Array();
        $.each(data.stats, function(_, stat) {
            if(stat.unit != UnitType.properties[unitType]) return true;
            console.log()
            labels.push(data.id);
            if(graphType == GraphType.PERCENTAGE) {
                needReview.push(Math.round((stat.needReview / stat.total) * 10000) / 100);
                rejected.push(Math.round((stat.rejected / stat.total) * 10000) / 100);
                approved.push(Math.round((stat.approved / stat.total) * 10000) / 100);
                translated.push(Math.round((stat.translated / stat.total) * 10000) / 100);
                untranslated.push(Math.round((stat.untranslated / stat.total) * 10000) / 100);
            } else {
                needReview.push(stat.needReview);
                rejected.push(stat.rejected);
                approved.push(stat.approved);
                translated.push(stat.translated);
                untranslated.push(stat.untranslated);
            }
        });
        $.each(data.detailedStats, function(_, dData) {
            $.each(dData.stats, function(_, dstat) {
                if(dstat.unit != UnitType.properties[unitType]) return true;
                labels.push(dData.id);
                if(graphType == GraphType.PERCENTAGE) {
                    needReview.push(Math.round((dstat.needReview / dstat.total) * 10000) / 100);
                    rejected.push(Math.round((dstat.rejected / dstat.total) * 10000) / 100);
                    approved.push(Math.round((dstat.approved / dstat.total) * 10000) / 100);
                    translated.push(Math.round((dstat.translated / dstat.total) * 10000) / 100);
                    untranslated.push(Math.round((dstat.untranslated / dstat.total) * 10000) / 100);
                } else {
                    needReview.push(dstat.needReview);
                    rejected.push(dstat.rejected);
                    approved.push(dstat.approved);
                    translated.push(dstat.translated);
                    untranslated.push(dstat.untranslated);
                }
            });
        });
        var dataset = {
            'labels': labels,
            'datasets': [
                { 'label': '번역됨', 'data': translated, 'backgroundColor': '#5CCA7B' },
                { 'label': '확인 필요', 'data': needReview, 'backgroundColor': '#E9DF1B' },
                { 'label': '검증됨', 'data': approved, 'backgroundColor': '#03A6D7' },
                { 'label': '거부', 'data': rejected, 'backgroundColor': '#FFA800' },
                { 'label': '미번역', 'data': untranslated, 'backgroundColor': '#EEEEEE' }
            ]
        };
        console.log(dataset);
        return dataset;
    }
}


function updateUserStatics(data) {

}

function updateVersionStatics(data) {
    var stats = data.stats
    console.log(JSON.stringify(stats));
    var table = '<thead><tr>' +
    '<th scope="col">이름</th>' +
    '<th scope="col">측정 기준</th><th scope="col">전체</th>' +
    '<th scope="col">미번역</th><th scope="col">확인 필요</th><th scope="col">거부</th>' + 
    '<th scope="col">검증됨</th><th scope="col">번역됨</th><th scope="col">마지막 번역</th></tr></thead><tbody>';
    var namePresent = false;
    var labels = new Array();
    var needReview = new Array();
    var rejected = new Array();
    var approved = new Array();
    var translated = new Array();
    $.each(stats, function(_, stat) {
        if(!namePresent) {
            table = table + renderStat(data.id, stat, false);
            namePresent = true;
        } else {
            table = table + renderStat('', stat, false);
        }
        
    })
    var detailed = data.detailedStats
    $.each(detailed, function(_, stat) {
        var dNamePresent = false;
        $.each(stat.stats, function(_, dStat) {
            if(!dNamePresent) {
                table = table + renderStat(stat.id, dStat, true);
                dNamePresent = true;
            } else {
                table = table +renderStat('', dStat, false);
            }
            
        })
    })
    table = table + "</tbody>"
    //console.log(table);
    data_cache = data;
    data_cache_type = DataType.VERSION_GLOBAL;
    updateGraph(GraphType.PERCENTAGE, UnitType.MESSAGE, DateRangeType.GLOBAL);
    $('#contribution-info').html(table);
    $('#contribution-info').removeClass("d-none");
    $('#contribution-info').addClass("d-table");
    $('#chart').removeClass("d-none");
    $('#chart').addClass("d-block");
    //$('#graphtypediv').removeClass("d-none");
    //$('#graphtypediv').addClass("d-flex");
}

function updateVersionDateStatics(data) {

}

function renderStat(name, stat, borderTop) {
    var s = '';
    if(borderTop) {
        s = '<tr class="border-top">';
    } else {
        s = '<tr>';
    }
    return s +
    '<th scope="row">'+ name + '</th>' +
    '<td>'+ stat.unit + '</td><td>'+ stat.total + '</td><td>'+ stat.untranslated + '</td><td>' + stat.needReview + '</td><td>' + stat.rejected + '</td><td>'+ stat.approved + '</td><td>'+ stat.translated + '</td><td>' + stat.lastTranslated + '</td></tr>';
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
            if(url == '') url = 'https://translate.zanata.org/';
            if(!url.endsWith('/')) url = url.concat('/');
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
        case 'word':
            return $('#word').prop('checked');
        default:
            return $('#' + name).val();
    }
}

function setCookie(cookie_name, value, days) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + days);
  
    var cookie_value = escape(value) + ((days == null) ? '' : ';    expires=' + exdate.toUTCString());
    document.cookie = cookie_name + '=' + cookie_value;
}

function getCookie(cookie_name) {
    var x, y;
    var val = document.cookie.split(';');

    for (var i = 0; i < val.length; i++) {
        x = val[i].substr(0, val[i].indexOf('='));
        y = val[i].substr(val[i].indexOf('=') + 1);
      
        x = x.replace(/^\s+|\s+$/g, '');
        if (x == cookie_name) {
            return unescape(y);
        }
    }
}
