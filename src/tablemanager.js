/* ===========================================================
 * tablemanager.js v1.0
 * Table Management plugin for Trumbowyg
 * http://alex-d.github.com/Trumbowyg
 * ===========================================================
 * Author : Timon Orawski, Senior Developer at Edsby
 *          Twitter : @timonorawski, @Edsby
 *          Website : www.edsby.com
 */

(function ($) {
    'use strict';
    var apply = function(def, node, key, value) {
			if (def.e.type == "attr") {
				node.attr(key, value);
			} else if (def.e.type == "css") {
				node.css(def.e.attr, value);
			}
		},
		fetchInitialValues = function(node, fields) {
			for (var i in fields) {
				if (fields[i].e) {
					if (fields[i].e.type == "attr") {
						fields[i].value = node.attr(i);
					} else if (fields[i].e.type == "css") {
						fields[i].value = node.css(i);
					}
				}
			}
		},
		getCellMap = function(table, rows) {
			var cellMap = [];
			for (var i =0 ; i < rows.length; i++) {
				cellMap.push([]);
			}
            var tcell = false;
			for (var r = 0; r < table[0].rows.length; r++) {
				for (var c = 0; c < table[0].rows[r].cells.length; c++) {
					var cellid = {
                            "row": r,
                            "column": c,
                            "colspan": table[0].rows[r].cells[c].colSpan,
                            "rowspan": table[0].rows[r].cells[c].rowSpan,
                            "cell": table[0].rows[r].cells[c]
                        },
						cellidx = c;
						tcell = table[0].rows[r].cells[c];
					while (cellMap[r][cellidx]) {
						cellidx = cellidx + 1;
					}
					for (var i = 0; i < tcell.colSpan; i++) {
						for (var j = 0; j < tcell.rowSpan; j++) {
							cellMap[r+j][cellidx+i] = cellid;
						}
					}
				}
			}
			return cellMap;
		},
		showDialog = function(conf) {
			fetchInitialValues(conf.node, conf.fields);
			for (var i in conf.fields) {
				if (!conf.fields[i].label) {
				    conf.fields[i].label = i.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
				}
			}
			var saved = JSON.parse(JSON.stringify(conf.fields));
			var isChanged = function(val, key) {
				return val[key] != (saved[key].value || "");
			};
			conf.trumbowyg.openModalInsert(
				// Title
				conf.title,
				// Fields
				conf.fields,
				function (val) { // v is value
					var tmpNode = conf.replacenode.clone();
					for (var i in val) {
						if (isChanged(val, i)) {
							apply(conf.fields[i], conf.node, i, val[i]);
						}
					}
				    var range = conf.trumbowyg.doc.createRange(),
					    documentSelection = conf.trumbowyg.doc.getSelection();
					documentSelection.removeAllRanges();
				    range.selectNode(conf.replacenode[0]);
				    documentSelection.addRange(range);
					conf.replacenode.replaceWith(tmpNode);
					conf.trumbowyg.execCmd('insertHTML', conf.replacenode[0].outerHTML);
					return true;
				}
			);
		};
    $.extend(true, $.trumbowyg, {
        langs: {
            en: {
                insertTable: 'Insert Table',
                editTable: 'Format Table',
				formatCell: 'Format Cell',
				formatRow: 'Format Row',
				insertLink: "Edit Link",
				rows: 'Rows',
				columns: 'Columns',
				cellwidth: 'Cell Width',
				cellborder: 'Cell Border',
				cellpadding: 'Cell Padding',
				addRow: "Insert Row",
				addColumn: "Insert Column",
				deleteRow: "Delete Row",
				deleteColumn: "Delete Column",
				mergeDown: "Merge Down",
				mergeRight: "Merge Right"
            }
        },
        plugins: {
            tablemanager: {
                init: function (trumbowyg) {
                    trumbowyg.addBtnDef('insertTable', {
                        ico: "table",
                        fn: function () {
                            trumbowyg.saveRange();
                            trumbowyg.openModalInsert(
                                // Title
                                trumbowyg.lang.insertTable,
                                // Fields
                                {
                                    rows: {
                                        type: 'number',
                                        required: true
                                    },
                                    columns: {
                                        type: 'number',
                                        required: true
                                    }
                                },
                                function (v) { // v is value
                                    /* create basic table */
									if (v.rows > 100 || v.columns > 100 || v.rows <= 0 || v.columns <= 0) {
										return false;
									}
                                    var table = ['<table width="500px" style="background-color: white;"></table>'];
                                    for (var i = 0; i < v.rows; i += 1) {
                                        table.push("<tr>");
                                        for (var j = 0; j < v.columns; j += 1) {
                                            table.push('<td>&nbsp;</td>');
                                        }
                                        table.push("</tr>");
                                    }
                                    /* you must use insertHTML to preserve undo/redo */
									trumbowyg.execCmd('insertHTML', table.join(""));
                                    return true;
                                });
                        }
                    });
                    trumbowyg.addBtnDef('formatCell', {
						fn: function () {
							trumbowyg.saveRange();
							var range = trumbowyg.range,
								fields = {
									width: {
										type: 'string',
										required: false,
										e: {
											type: "attr"
										}
									},
									border: {
										type: 'string',
										required: false,
										e: {
											"type": "css",
											"attr": "border"
										}
									},
									padding: {
										type: 'string',
										required: false,
										e: {
											"type": "css",
											"attr": "border"
										}
									},
									"background-color": {
										type: 'string',
										required: false,
										e: {
											"type": "css",
											"attr": "background-color"
										}
									},
									align: {
										type: "string",
										required: false,
										e: {
											type: "attr"
										}
									},
									valign: {
										type: "string",
										required: false,
										e: {
											type: "attr"
										}
									}
								},
								startEl = $(trumbowyg.range.startContainer),
								cell = startEl.closest('td'),
								row = startEl.closest('tr'),
								table = startEl.closest('table'),
								rows = table.find('tr');
							showDialog({
								trumbowyg: trumbowyg,
								title: trumbowyg.lang.formatCell,
								fields: fields,
								node: cell,
								replacenode: table
							});
						}
					});
					trumbowyg.addBtnDef('addColumn', {
						fn: function () {
							trumbowyg.saveRange();
							var range = trumbowyg.range,
								startEl = $(trumbowyg.range.startContainer),
								cell = startEl.closest('td'),
								row = startEl.closest('tr'),
								table = startEl.closest('table'),
								rows = table.find('tr');
							var index = cell[0].cellIndex;
							for (var i = 0; i < table[0].rows.length; i++) {
								table[0].rows[i].insertCell(index);
							}
							trumbowyg.syncCode();
						}
					});
					trumbowyg.addBtnDef('deleteColumn', {
						fn: function () {
							trumbowyg.saveRange();
							var range = trumbowyg.range,
								startEl = $(trumbowyg.range.startContainer),
								cell = startEl.closest('td'),
								row = startEl.closest('tr'),
								table = startEl.closest('table'),
								rows = table.find('tr');
							var index = cell[0].cellIndex;
							for (var i = 0; i < table[0].rows.length; i++) {
								table[0].rows[i].deleteCell(index);
							}
							trumbowyg.syncCode();
						}
					});
					trumbowyg.addBtnDef('mergeRight', {
						fn: function () {
							trumbowyg.saveRange();
							var range = trumbowyg.range,
								startEl = $(trumbowyg.range.startContainer),
								cell = startEl.closest('td'),
								row = startEl.closest('tr'),
								table = startEl.closest('table'),
								rows = table.find('tr');
							var index = cell[0].cellIndex;
							var cellMap = getCellMap(table, rows);
							var rowindex = row[0].rowIndex;
                            var rowMap = cellMap[rowindex];
                            if (cell[0].cellIndex < rowMap.length - 1) {
                                var theCell = rowMap[cell[0].cellIndex];
                                var mergeCell = rowMap[cell[0].cellIndex + 1];
                                if (mergeCell.row != theCell.row || mergeCell.row == theCell.row && mergeCell.rowspan != theCell.rowspan) {
                                    alert("Cannot merge cells across merges.")
                                } else {
                                    // can merge
                                    row[0].deleteCell(index + 1);
                                    cell.attr('colspan', cell[0].colSpan + 1);
                                    trumbowyg.syncCode();
                                }
                            } else {
                                alert("No Cell to merge right to");
                            }
						}
					});
                    trumbowyg.addBtnDef('formatRow', {
						fn: function () {
							trumbowyg.saveRange();
							var range = trumbowyg.range,
								fields = {
									height: {
										type: 'string',
										required: false,
										e: {
											type: 'attr'
										}
									}/*,
									cellborder: {
										type: 'number',
										required: false
									},
									cellpadding: {
										type: 'number',
										required: false
									}*/
								},
								startEl = $(trumbowyg.range.startContainer),
								cell = startEl.closest('td'),
								row = startEl.closest('tr'),
								table = startEl.closest('table'),
								rows = table.find('tr');
							showDialog({
								trumbowyg: trumbowyg,
								title: trumbowyg.lang.formatRow,
								fields: fields,
								node: row,
								replacenode: table
							});
						}
					});
					trumbowyg.addBtnDef('addRow', {
						fn: function () {
							trumbowyg.saveRange();
							var range = trumbowyg.range,
								startEl = $(trumbowyg.range.startContainer),
								cell = startEl.closest('td'),
								row = startEl.closest('tr'),
								table = startEl.closest('table'),
								rows = table.find('tr');
							range.selectNode(row[0]);
							trumbowyg.range.insertNode(row.clone()[0]);
							trumbowyg.syncCode();
						}
					});
					trumbowyg.addBtnDef('deleteRow', {
						fn: function () {
							trumbowyg.saveRange();
							var range = trumbowyg.range,
								startEl = $(trumbowyg.range.startContainer),
								cell = startEl.closest('td'),
								row = startEl.closest('tr'),
								table = startEl.closest('table'),
								rows = table.find('tr');
							table[0].deleteRow(row[0].rowIndex)
							trumbowyg.syncCode();
						}
					});
					trumbowyg.addBtnDef('mergeDown', {
						fn: function () {
							trumbowyg.saveRange();
							var range = trumbowyg.range,
								startEl = $(trumbowyg.range.startContainer),
								cell = startEl.closest('td'),
								row = startEl.closest('tr'),
								table = startEl.closest('table'),
								rows = table.find('tr');
							var index = cell[0].cellIndex;
							var rowIndex = row[0].rowIndex;
							var cellMap = getCellMap(table, rows);
							var mapRow = cellMap[row[0].rowIndex];
							if (row[0].rowIndex+1 < cellMap.length) {
								var mergeRow = cellMap[row[0].rowIndex + 1];
                                var theCell = mapRow[cell[0].cellIndex];
								var mergeCell = mergeRow[cell[0].cellIndex];
								if (theCell.column == mergeCell.column && theCell.colspan == mergeCell.colspan) {
									var newrowspan = theCell.rowspan + mergeCell.rowspan;
									rows[rowIndex+1].deleteCell(index);
									cell.attr('rowspan', newrowspan);
									trumbowyg.syncCode();
								} else {
                                    alert("Cannot merge cells across merges.");
                                }
							} else {
								alert("nothing to merge into")
							}

						}
					});
                    trumbowyg.addBtnDef('editTable', {
						fn: function () {
							trumbowyg.saveRange();
							var range = trumbowyg.range,
								fields = {
									/*rows: {
										type: 'number',
										required: false
									},
									columns: {
										type: 'number',
										required: false
									},*/
									caption: {
										type: 'string',
										required: false
									},
									summary: {
										type: 'string',
										required: false,
										e: {
											type: "attr"
										}
									},
									"background-color": {
										type: 'string',
										required: false,
										e: {
											"type": "css",
											"attr": "background-color"
										}
									},
									width: {
										type: 'string',
										required: false,
										e: {
											type: "attr"
										}
									},
									border: {
										type: 'string',
										required: false,
										e: {
											"type": "css",
											"attr": "border"
										}
									},
									padding: {
										type: 'string',
										required: false,
										e: {
											"type": "css",
											"attr": "border"
										}
									},
									align: {
										type: "string",
										required: false,
										e: {
											type: "attr"
										}
									}
								},
								startEl = $(trumbowyg.range.startContainer),
								cell = startEl.closest('td'),
								row = startEl.closest('tr'),
								table = startEl.closest('table'),
								rows = table.find('tr'),
								caption = table.find('caption');
							if (caption.length > 0) {
								fields.caption.value = caption.html();
							}
							showDialog({
								trumbowyg: trumbowyg,
								title: trumbowyg.lang.editTable,
								fields: fields,
								node: table,
								replacenode: table
							});
						}
					});
                }
            }
        }
    });
})(jQuery);
