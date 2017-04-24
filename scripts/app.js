"use strict";
var columns = 0,
	target = '',
	API_KEY = 'd1b885b8d202ab320717b54d9265e360db151e69be811f38da2f24fdd09333a5',
	VTRANS_API = 'https://vtransapi.aot.state.vt.us/api/v2/';

function getView(name, callback) {
	$.get(VTRANS_API + "legos/_table/views?fields=*&related=*&order=layout_order asc&filter=view%3D" + name + "&api_key=" + API_KEY, function (response) {
		$.each(response.resource, function (i, r) {
			var block = {
				order: r.layout_order,
				className: r.className + " show-short",
				title: r.blocks.name,
				template: r.blocks.template,
				query: r.blocks.query,
				short: r.blocks.short,
				extended: r.blocks.extended,
				tags: [], 
				blockId: 'block' + Math.random().toString().substring(4) + "-" + Math.random().toString().substring(3)
			};
			
			$.each(r.tags, function (i, tag) {
				block.tags.push(tag.tag);
			});
			callback(block);
		});
	});
}

function createBrick(template, brick, attachmentPoint) {
	var firstNumber = /(\d+)/, // finds the first number.
		size = parseInt(firstNumber.exec(brick.className)[1]); //TODO different screen sizes?

	if (size + columns > 12) {
		$('body .container-fluid.bricks').append('<div class="row">');
		columns = 0;
	}
	
	if (!attachmentPoint) {
		var attachmentPoint = 'body .container-fluid.bricks>.row:last-of-type';
	}
	
	var $html = $(Mustache.render(template, brick));
	$(attachmentPoint).append($html);
	columns += size; // need to parse this out of sizes and consider larger screens maybe.
	
	
}

function createRow() {
	$('body .container-fluid').append('<div class="row">');
}

$(document).ready(function() {
	getView(view, function(block) { // THIS IS WHAT NEEDS TO CHANGE TODO
		$.get(block.template, function (template) {
			createBrick(template, block);
		});
	});
});	