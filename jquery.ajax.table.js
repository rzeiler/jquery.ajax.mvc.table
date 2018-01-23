(function ($) {
    $.fn.ajaxtable = function (options) {

        var settings = $.extend({
            url: '',
            data: [],
            height: 200,
            start: 0,
            length: 10,
            fixed: 0,
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


        var template = "<table cellpadding='0' cellspacing='0'><tr>";
        template += "<td class='head fix grey lighten-4' ><div style='overflow:hidden;'><table><thead></thead><tbody></tbody></table></div></td>";
        template += "<td class='head' ><div style='overflow:hidden;'><table><thead></thead><tbody></tbody></table></div></td>";
        template += "</tr><tr>";
        template += "<td class='body fix grey lighten-4' ><div style='overflow:hidden;height:400px;'><table><thead></thead><tbody></tbody></table></div></td>";
        template += "<td class='body' ><div style='overflow:auto;height:400px;'><table><thead></thead><tbody></tbody></table></div></td>";
        template += "</tr>";
        template += "<tr><td colspan='2' class='footer' ><ul class='pagination'></ul><span class='new badge' style='margin-top:15px;padding:10px;'></span></td></tr>"
        template += "</table>";

        place.html(template);

        place.find('td, th').css({
            'padding': 0,
            'vertical-align': 'top'
        });

        $(window).resize(function () {

            var top = parseFloat(place.find('td.body:not(.fix) div table thead').outerHeight(true)) + 2;
            place.find('td.body div table').css('marginTop', -top);

            initWidth = parseFloat(place.prop("clientWidth"));
            fixWidth = parseFloat(place.find('td.body.fix div').prop("offsetWidth"));

            var scrollWidth = (initWidth - fixWidth);
            place.find("table:first").css({
                'width': initWidth
            });
            /* feste spalten breite  */
            place.find("td.fix div").css({
                'width': fixWidth + 'px'
            });
            place.find("td:not(.fix) div").css({
                'width': scrollWidth + 'px'
            });

            /* breiten und höhen */
            var headWidth = parseFloat(place.find('td.body:not(.fix) div table').outerWidth(true));
            var divInnerWidth = parseFloat(place.find('td.body:not(.fix) div').prop("clientWidth"));
            var divInnerHeight = parseFloat(place.find('td.body:not(.fix) div').prop("clientHeight"));
            var divTableWidth = parseFloat(place.find('td.body:not(.fix) div table').prop("clientWidth"));
            var divTableHeight = parseFloat(place.find('td.body:not(.fix) div table').prop("clientHeight"));
            /* div höhe und breite */
            place.find('td.head:not(.fix) div').innerWidth(divInnerWidth);
            place.find('td.body.fix div').innerHeight(divInnerHeight);
            /* tabellen breite */
            place.find('td.head:not(.fix) div table').css({
                'width': divTableWidth
            });
            /* tabellen höhe */
            place.find('td.body.fix div table').css({
                'height': divTableHeight
            });
            /* spalten breite */
            place.find('td.body:not(.fix) div table thead tr:eq(0) th').each(function (i, e) {
                place.find('td.head:not(.fix) div table thead tr:eq(0) th').eq(i).css({
                    width: $(e).outerWidth(true)
                });
            });

            for (var i = 0; i < options.fixed; i++) {
                var outerWidth = place.find('td.body div table thead tr:eq(0) th').eq(i).outerWidth(true);
                place.find('td.head.fix div table thead tr:eq(0) th').eq(i).outerWidth(outerWidth);
            }

            /* spalten höhe */
            place.find('td.body:not(.fix) div table tbody tr').each(function (iTr, tr) {
                var outerHeight = $(tr).find('td:eq(0)').outerHeight(true);
                place.find('td.body.fix div table tbody tr:eq(' + iTr + ') td:eq(0)').css({
                    height: outerHeight
                });
            });

        });

        footer = place.find('td.footer');
        pagination = place.find('ul.pagination');
        place.find('div thead').html("<tr></tr><tr></tr>");

        $.each(options.columns, function (i, e) {
            var head = place.find('td').not('.fix').find('div thead');
            if (options.fixed >= i)
                head = place.find('td.fix div thead');

            $("<th/>", { 'class': 'sort', text: e.title, 'dir': '', 'index': i, 'title': 'Sortieren (Absteigend/Aufsteigend)' }).appendTo(head.find('tr:eq(0)'));
            $("<th/>", { 'class': 'filter', html: '<input type="text" title="Suche nach" index="' + i + '"  >' }).appendTo(head.find('tr:eq(1)'));
        });
        /* filter */
        place.on('keyup change', 'th.filter input', function () {
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
            place.find('th.sort').each(function (index, element) {
                var th = $(this);
                if (!th.attr('dir') == '') {
                    th.addClass('blue lighten-4');
                    options.order.push({
                        column: th.attr('index'),
                        dir: th.attr('dir')
                    });
                } else {
                    th.removeClass('blue lighten-4');
                }
            });
            build();

            var i = th.index();
            place.find('td.body:not(.fix) td:eq(' + i + ')').addClass('blue darken-1');

        });
        /* scroll */
        place.find('td.body:not(.fix) div').scroll(function () {
            var body = $(this);
            var currPos = parseFloat(body.scrollLeft());
            place.find('td.head:not(.fix) div').scrollLeft(currPos);
            var currPos = body.scrollTop();
            place.find('td.body.fix div').scrollTop(currPos);
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

                var tbody = place.find('td.body:not(.fix) div tbody');
                var tbody_fix = place.find('td.body.fix div tbody');

                tbody.html('');
                tbody_fix.html('');

                pagination.html('');

                /* fülle tabelle */
                $.each(response.data, function (i, item) {

                    function createTd(Item, Column) {
                        var content = Item[Column.data];
                        var tooltip = Column.tooltip;
                        /* date format */
                        if (content != null && Column.type == 'date') {
                            dt = new Date(parseInt(content.replace("/Date(", "").replace(")/", ""), 10));
                            content = dt.getDate() + '.' + (dt.getMonth() + 1) + "." + dt.getFullYear();
                        }
                        /* bool format */
                        if (content != null && Column.type == 'bool')
                            content = parseInt(content) == 1 ? 'Ja' : 'Nein';

                        if (Column.text != null)
                            content = Column.text;

                        if (Column.url != null) {
                            var target = (Column.target != undefined) ? "target='" + Column.target + "'" : "";
                            content = "<a href='" + Column.url.replace("$", Item[Column.data]) + "' " + target + " >" + content + "</a>";
                        }

                        return $("<td/>", { html: content, title: Column.tooltip });
                    }

                    var tr = $("<tr/>");
                    var columns = options.columns.slice(options.fixed + 1);
                    $.each(columns, function (a, column) {
                        createTd(item, column).appendTo(tr);
                    });
                    tr.appendTo(tbody);
                    tr = $("<tr/>");
                    var columns = options.columns.slice(0, options.fixed + 1);
                    $.each(columns, function (a, column) {
                        createTd(item, column).appendTo(tr);
                    });
                    tr.appendTo(tbody_fix);

                });

                /* texte */
                var InfoTitel = "_START_ bis _END_ von _TOTAL_ Einträgen";

                if (response.recordsFiltered != response.recordsTotal)
                    InfoTitel += "(gefiltert von _MAX_ Einträgen)"

                var end = ((options.start + options.length) > response.recordsFiltered) ? response.recordsFiltered : options.start + options.length;
                footer.find('.badge').text(InfoTitel.replace("_START_", options.start).replace("_END_", end).replace("_TOTAL_", response.recordsFiltered).replace("_MAX_", response.recordsTotal));

                if (response.data.length == 0)
                    $("<tr><td colspan='" + options.columns.length + "' >Keine Daten in der Tabelle vorhanden</td></tr>").appendTo(place.find('td.body').not('.fix').find('div tbody'));

                /* bereich und länge ermitteln */
                var len = Math.round(response.recordsFiltered / options.length) + 1;
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

                /* breiten neu errechnen */
                $(window).trigger('resize');

            }).fail(function (jqxhr, status, error) {
                console.log("error", jqxhr);
            });
        }

        build();
    };
}(jQuery));