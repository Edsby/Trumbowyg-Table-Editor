/* ===========================================================
 * tablemanager.js v1.0
 * Table Management plugin for Trumbowyg
 * http://alex-d.github.com/Trumbowyg
 * ===========================================================
 * Author : Timon Orawski, Senior Developer at Edsby
 *		  Twitter : @timonorawski, @Edsby
 *		  Website : www.edsby.com
 */

(function ($) {
	'use strict';
	var apply = function(def, pNodes, key, value) {
			var doApply = function(toNode) {
					toNode = $(toNode);
					if (def.e.type == "attr") {
						toNode.attr(key, value);
					} else if (def.e.type == "css") {
						toNode.css(def.e.attr, value);
					}
				};
			if (def.e) {
				for (var i = 0; i < pNodes.length; i++) {
					var node = $(pNodes[i]);
					if (def.e && def.e.applyto) {
						if (node.is(def.e.applyto)) {
							doApply(node);

						} else {
							var applynodes = node.find(def.e.applyto);
							for (var j = 0; j < applynodes.length; j++) {
								doApply(applynodes[j]);
							}
						}
					} else if (def.e) {
						doApply(pNodes[i]);
					}
				}
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
				var colidx = 0;
				for (var c = 0; c < table[0].rows[r].cells.length; c++) {
					var cellid = {
							"row": r,
							"column": c,
							"truecolumn": colidx,
							"colspan": table[0].rows[r].cells[c].colSpan,
							"rowspan": table[0].rows[r].cells[c].rowSpan,
							"cell": table[0].rows[r].cells[c]
						},
						cellidx = c;
					tcell = table[0].rows[r].cells[c];
					colidx = colidx + cellid.colspan;
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
		replaceNodeWithHTML = function(trumbowyg, replaceNode, html) {
			var range = trumbowyg.doc.createRange(),
				documentSelection = trumbowyg.doc.getSelection();
			documentSelection.removeAllRanges();
			range.selectNode(replaceNode[0]);
			documentSelection.addRange(range);
			trumbowyg.execCmd('insertHTML', html);
			// TODO: try to restore selection
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
							if (conf.relatedNodes) {
								apply(conf.fields[i], conf.relatedNodes, i, val[i]);
							}
							if (i == "caption" && conf.replacenode.is("table")) {
								var caption = conf.replacenode.find('caption');
								if (caption.length > 0) {
									caption.html(val[i]);
								} else {
									conf.replacenode.prepend("<caption>" + val[i] + "</caption>");
								}
							}
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
				formatColumn: "Format Column",
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
									var table = ['<table width="500px" style="background-color: white;">'];
									for (var i = 0; i < v.rows; i += 1) {
										table.push("<tr>");
										for (var j = 0; j < v.columns; j += 1) {
											table.push('<td>&nbsp;</td>');
										}
										table.push("</tr>");
									}
									table.push("</table>");
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
											"attr": "padding"
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
							var cellMap = getCellMap(table, rows);
							var cellid = false, colidx = -1;;
							for (var r in cellMap) {
								for (var c in cellMap[r]) {
									if (cellMap[r][c].cell === cell[0]) {
										cellid = cellMap[r][c];
										colidx = c;
										break;
									}
								}
								if (cellid) {
									break;
								}
							}
							var savedTable = table.clone();
							for (var r in cellMap) {
								var rowCell = cellMap[r][colidx];
								if (rowCell.truecolumn + rowCell.colspan - 1 > colidx) {
									// increase colspan, used cellmap cached version because we may see this cell more than once (if rowspan > 1)
									rowCell.cell.colSpan = rowCell.colspan + 1;
								} else {
									// insert cell
									table[0].rows[r].insertCell(rowCell.column + 1);
								}
							}
							var html = table[0].outerHTML;
							table.html(savedTable.html());
							replaceNodeWithHTML(trumbowyg, table, html);
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
							var cellMap = getCellMap(table, rows);
							var cellid = false, colidx = -1;;
							for (var r in cellMap) {
								for (var c in cellMap[r]) {
									if (cellMap[r][c].cell === cell[0]) {
										cellid = cellMap[r][c];
										colidx = c;
										break;
									}
								}
								if (cellid) {
									break;
								}
							}
							var savedTable = table.clone();

							for (var i = 0; i < table[0].rows.length; i++) {
								table[0].rows[i].deleteCell(index);
							}
							var html = table[0].outerHTML;
							table.html(savedTable.html());
							replaceNodeWithHTML(trumbowyg, table, html);
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
								var mergeCell = rowMap[cell[0].cellIndex + theCell.colspan];
								if (mergeCell.row != theCell.row || mergeCell.row == theCell.row && mergeCell.rowspan != theCell.rowspan) {
									alert("Cannot merge cells across merges.")
								} else {
									var newcolspan = theCell.colspan + mergeCell.colspan;
									var savedTable = table.clone();
									// can merge
									row[0].deleteCell(index + 1);
									cell.attr('colspan', newcolspan);
									var html = table[0].outerHTML;
									table.html(savedTable[0].html);
									replaceNodeWithHTML(trumbowyg, table, html);
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
											type: 'attr',
											applyto: 'tr'
										}
									},
									width: {
										type: 'string',
										required: false,
										e: {
											type: "attr",
											applyto: "td"
										}
									},
									border: {
										type: 'string',
										required: false,
										e: {
											"type": "css",
											"attr": "border",
											applyto: "td"
										}
									},
									padding: {
										type: 'string',
										required: false,
										e: {
											"type": "css",
											"attr": "padding",
											applyto: "td"
										}
									},
									"background-color": {
										type: 'string',
										required: false,
										e: {
											"type": "css",
											"attr": "background-color",
											applyto: "td"
										}
									},
									align: {
										type: "string",
										required: false,
										e: {
											type: "attr",
											applyto: "td"
										}
									},
									valign: {
										type: "string",
										required: false,
										e: {
											type: "attr",
											applyto: "td"
										}
									}
									/*,
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
					trumbowyg.addBtnDef('formatColumn', {
						fn: function () {
							trumbowyg.saveRange();
							var range = trumbowyg.range,
								fields = {
									width: {
										type: 'string',
										required: false,
										e: {
											type: "attr",
											applyto: "td"
										}
									},
									border: {
										type: 'string',
										required: false,
										e: {
											"type": "css",
											"attr": "border",
											applyto: "td"
										}
									},
									padding: {
										type: 'string',
										required: false,
										e: {
											"type": "css",
											"attr": "padding",
											applyto: "td"
										}
									},
									"background-color": {
										type: 'string',
										required: false,
										e: {
											"type": "css",
											"attr": "background-color",
											applyto: "td"
										}
									},
									align: {
										type: "string",
										required: false,
										e: {
											type: "attr",
											applyto: "td"
										}
									},
									valign: {
										type: "string",
										required: false,
										e: {
											type: "attr",
											applyto: "td"
										}
									}
									/*,
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
							var cellMap = getCellMap(table, rows);
							var applyNodes = [], colidx = -1;
							for (var row in cellMap) {
								for (var col in cellMap[row]) {
									if (cellMap[row][col].cell === cell[0]) {
										colidx = col;
										break
									}
								}
								if (colidx != -1) {
									break;
								}
							}
							for (var row in cellMap) {
								applyNodes.push(cellMap[row][colidx].cell);
							}
							showDialog({
								trumbowyg: trumbowyg,
								title: trumbowyg.lang.formatColumn,
								fields: fields,
								node: cell,
								relatedNodes: applyNodes,
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
							var cellMap = getCellMap(table, rows);
							var savedTable = table.clone();
							var newRow = row.clone()[0];
							var insertedRow = table[0].insertRow(row[0].rowIndex+cell[0].rowSpan);
							var mapRow = cellMap[row[0].rowIndex];
							for (var cid = 0; cid < mapRow.length; cid++) {
								var cl = mapRow[cid];
								if (cl.truecolumn == cid) {
									if (cl.rowspan > 1) {
										cl.cell.rowSpan = cl.cell.rowSpan + 1;
									} else {
										var c = insertedRow.insertCell(insertedRow.cells.length);
										c.innerHTML = "&nbsp;";
										if (cl.colspan > 1) {
											c.colSpan = cl.colspan;
										}
									}
								}
							}
							var html = table[0].outerHTML;
							table.html(savedTable.html());
							replaceNodeWithHTML(trumbowyg, table, html);
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

							var savedTable = table.clone();
							table[0].deleteRow(row[0].rowIndex)
							var html = table[0].outerHTML;
							table.html(savedTable.html());
							replaceNodeWithHTML(trumbowyg, table, html);
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
							if (row[0].rowIndex+cell[0].rowSpan-1 < cellMap.length) {
								var theCell = false, colidx = -1;
								for (var r in cellMap) {
									for (var c in cellMap[r]) {
										if (cellMap[r][c].cell === cell[0]) {
											colidx = c;
											theCell = cellMap[r][c];
											break
										}
									}
									if (colidx != -1) {
										break;
									}
								}
								var mergeRow = cellMap[row[0].rowIndex + theCell.rowspan];
								var mergeCell = mergeRow[colidx];
								if (theCell.truecolumn == mergeCell.truecolumn && theCell.colspan == mergeCell.colspan) {
									var newrowspan = theCell.rowspan + mergeCell.rowspan;
									var savedTable = table.clone();
									rows[rowIndex+theCell.rowspan].deleteCell(index);
									cell.attr('rowspan', newrowspan);
									var html = table[0].outerHTML;
									table.html(savedTable.html());
									replaceNodeWithHTML(trumbowyg, table, html);
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
