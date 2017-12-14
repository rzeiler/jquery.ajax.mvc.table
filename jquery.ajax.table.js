(function ($) {
    $.fn.ajaxtable = function (options) {

        var settings = $.extend({
            url:'',
            start: 0,
            length: 10,
            fixed: false,
            columns: [],
            search: '',
            order: [
                {
                    column: 0,
                    dir: 'asc'
                }
            ]
        }, options);

        place = this;

        var footer = $("<div class='row' ><div class='col s8' ></div><div class='col s4' ><span class='new badge' style='margin-top:15px;padding:10px;'></span></div></div>");
        var table_head = $("<table/>");
        var table_body = $("<table/>", { 'class': 'highlight' });
        var thead_head = $("<thead/>");
        var thead_body = $("<thead/>");
        var tbody_body = $("<tbody/>");
        var pagination = $("<ul/>", { 'class': 'pagination' });

        var scroll_body = $("<div/>", { 'class': 'scroll_body', 'style': "overflow:auto; z-index:1; height:400px;" });
        var scroll_head = $("<div/>", { 'class': 'scroll_head blue-grey lighten-5', 'style': 'overflow:hidden; padding-right:17px;   margin-right:17px;' });

        scroll_head.appendTo(place);
        scroll_body.appendTo(place);
        footer.appendTo(place);
        pagination.appendTo(footer.find('div.col:eq(0)'));

        table_head.appendTo(scroll_head);
        table_body.appendTo(scroll_body);

        thead_head.appendTo(table_head);
        thead_body.appendTo(table_body);
        tbody_body.appendTo(table_body);

        $("<tr/>").appendTo(thead_head);
        $("<tr/>").appendTo(thead_head);
        $("<tr/>").appendTo(thead_body);

        var dynamicHead = null;
        var dynamicBody = null;

        $.each(options.columns, function (i, e) {
            $("<th/>", { 'class': 'sort', text: e.title, 'dir': '', 'index': i, 'title': 'Sortieren (Absteigend/Aufsteigend)' }).appendTo(thead_head.find('tr:eq(0)'));
            $("<th/>", { text: e.title, 'dir': '', 'index': i }).appendTo(thead_body.find('tr:eq(0)'));
            $("<th/>", { 'class': 'filter', html: '<input type="text" title="Suche nach" index="' + i + '"  >' }).appendTo(thead_head.find('tr:eq(1)'));
        });

        /* filter */
        place.on('change', 'th.filter input', function () {
            var input = $(this);
            options.columns[input.attr('index')].search = this.value;
            options.start = 0;
            build();
        });

        /* seiten navicgation */
        footer.on('click', 'ul>li.waves-effect', function () {
            var start = $(this).attr('start');
            if (start !== null) {
                options.start = parseInt(start);
                build();
            }
        });

        /* sort click */
        place.on('click', 'th.sort', function () {
            var th = $(this);
            if (th.attr('dir') == '') {
                th.attr('dir', 'asc');
            } else {
                if (th.attr('dir') == 'asc') {
                    th.attr('dir', 'desc');
                } else {
                    th.attr('dir', '');
                }
            }
            options.order = [];
            thead_head.find('tr:eq(0) th').each(function () {
                var th = $(this);
                if (!th.attr('dir') == '') {
                    options.order.push({
                        column: th.attr('index'),
                        dir: th.attr('dir')
                    });
                }
            });
            build();
        });

        var top = '-' + (scroll_body.find("table thead").outerHeight(true) + 1) + 'px';
        scroll_body.find("table").css('marginTop', top);
        scroll_body.scroll(function () {
            var currPos = scroll_body.scrollLeft();
            scroll_head.scrollLeft(currPos);
            var currPos = scroll_body.scrollTop();
            dynamicBody.scrollTop(currPos);

        });

        $(window).resize(function () {
            var witdh = scroll_body.find("thead tr:eq(0) th:eq(0)").outerWidth(true)

            var cssOption = { position: 'absolute', top: 0, left: 0, height: 0, width: witdh, overflow: 'hidden' };
            var offset = scroll_head.position();
            cssOption.top = offset.top;
            cssOption.left = offset.left;
            cssOption.height = scroll_head.outerHeight(true);
            dynamicHead.css(cssOption);

            var offset = scroll_body.position();
            cssOption.top = offset.top;
            cssOption.left = offset.left;
            cssOption.height = scroll_body.outerHeight(true) - 17;
            dynamicBody.css(cssOption);
        });

        function build() {
            /* default */
            if (options.order.length == 0) {
                options.order.push({
                    column: 0,
                    dir: 'asc'
                });
            }

            $.ajax({
                method: 'POST',
                url: options.url, 
                data: options,
                dataType: 'json',
                cache: false,
                beforeSend: function () {
                    place.fadeTo(0, .5);
                },
                complete: function () {
                    place.fadeTo(0, 1);
                }
            }).done(function (response, status, jqxhr) {
                tbody_body.html('');
                pagination.html('');

                /* fülle tabelle */
                $.each(response.data, function (i, e) {
                    var tr = $("<tr/>");
                    $.each(options.columns, function (a, d) {
                        var content = e[d.data];
                        if (d.url != null) {
                            content = "<a href='" + d.url.replace("$", e[d.data]) + "'>" + e[d.data] + "</a>";
                        }
                        $("<td/>", { html: content }).appendTo(tr);
                    });
                    tr.appendTo(tbody_body);
                });

                scroll_body.find("thead tr:eq(0) th").each(function (i, e) {
                    scroll_head.find("thead tr:eq(0) th").eq(i).css({
                        width: $(e).outerWidth(true)
                    });
                });

                /* tabellen kopieren */
                if (options.fixed > 0) {

                    place.find('.fix').remove();

                    dynamicHead = scroll_head.clone();
                    dynamicBody = scroll_body.clone();

                    dynamicHead.appendTo(place);
                    dynamicBody.appendTo(place);

                    dynamicHead.attr('class', 'fix blue-grey lighten-5 z-depth-1');
                    dynamicBody.attr('class', 'fix white z-depth-2');

                    var witdh = scroll_body.find("thead tr:eq(0) th:eq(0)").outerWidth(true)

                    var cssOption = { position: 'absolute', top: 0, left: 0, height: 0, width: witdh, overflow: 'hidden' };
                    var offset = scroll_head.position();
                    cssOption.top = offset.top;
                    cssOption.left = offset.left;
                    cssOption.height = scroll_head.outerHeight(true);
                    dynamicHead.css(cssOption);

                    var offset = scroll_body.position();
                    cssOption.top = offset.top;
                    cssOption.left = offset.left;
                    cssOption.height = scroll_body.outerHeight(true) - 17;
                    dynamicBody.css(cssOption);

                    $.each(options.columns, function (i, e) {
                        dynamicHead.find("thead tr:eq(1) th").eq(i).find("input").val(e.search);
                    });
                }


                scroll_head.find("table").css('width', scroll_body.find("table").outerWidth(true));

                /* texte */
                var InfoTitel = "_START_ bis _END_ von _TOTAL_ Einträgen";

                if (response.recordsFiltered != response.recordsTotal)
                    InfoTitel += "(gefiltert von _MAX_ Einträgen)"

                var end = ((options.start + options.length) > response.recordsFiltered) ? response.recordsFiltered : options.start + options.length;
                footer.find('.badge').text(InfoTitel.replace("_START_", options.start).replace("_END_", end).replace("_TOTAL_", response.recordsFiltered).replace("_MAX_", response.recordsTotal));

                if (response.data.length == 0)
                    $("<tr><td colspan='" + options.columns.length + "' >Keine Daten in der Tabelle vorhanden</td></tr>").appendTo(tbody_body);

                /* bereich und länge ermitteln */
                var len = Math.round(response.recordsFiltered / options.length);
                var min = (options.start / options.length) - 5;
                min = (min < 0) ? 0 : min;
                var max = ((min + 10) > len) ? len : (min + 10);
                if (max == len)
                    min = ((max - 10) > 0) ? (max - 10) : min;

                /* erstellt die navigationsobjekte */
                function createLi(pagination, classNames, startIndex, title) {
                    var li = $("<li/>", { start: startIndex, 'class': classNames });
                    $('<a/>', { text: title }).appendTo(li);
                    li.appendTo(pagination);
                }

                if (options.start > 0) {
                    createLi(pagination, 'waves-effect', parseInt(options.start - options.length), '<');
                } else {
                    createLi(pagination, 'disabled', null, '<');
                }
                for (var i = min ; i < max  ; i++) {
                    createLi(pagination, (options.start == i * options.length ? "active" : "waves-effect"), parseInt(i * options.length), (i + 1));
                }
                if ((options.start + options.length) < (options.length * len)) {
                    createLi(pagination, 'waves-effect', parseInt(options.start + options.length), '>');
                } else {
                    createLi(pagination, 'disabled', null, '>');
                }

            }).fail(function (jqxhr, status, error) {
                console.log("error", jqxhr);
            });
        }

        build();
    };
}(jQuery));