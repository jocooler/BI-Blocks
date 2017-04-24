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

function createBrick(brick) {
	var firstNumber = /(\d+)/, // finds the first number, with no spaces, letters, etc.
		size = parseInt(firstNumber.exec(brick.className)[1]); //TODO different screen sizes?

	if (size + columns > 12) {
		$('body .container-fluid.bricks').append('<div class="row">');
		columns = 0;
	}
	
	var $html = $(Mustache.render('<div class="brick {{className}}" data-tags="{{#tags}}{{.}} {{/tags}}"><div class="card"></div></div>', brick));
	$('body .container-fluid.bricks>.row:last-of-type').append($html);
	
	columns += size;
	return $html;
}

function fillBrick(brick, data, template) {
	var $html = $(Mustache.render(template, data));
	$('.card', $(brick)).append($html);
}

$(document).ready(function() {
	getView(view, function(data) {
		var $brick = createBrick(data);
		$.get(data.template, function (template) {
			fillBrick($brick, data, template);
		});
	});
});	