"use strict";
var columns = 0,
	target = '',
	API_KEY = 'd1b885b8d202ab320717b54d9265e360db151e69be811f38da2f24fdd09333a5',
	VTRANS_API = 'https://vtransapi.aot.state.vt.us/api/v2/',
	searchIndex=[],
	tags = [],
	tagIcons = {chart:{fa:"pie-chart",tag:"c$h$a$r$t"}, map:{fa:"map",tag:"m$a$p"},data:{fa:"database",tag:"d$a$t$a"},app:{fa:"cogs",tag:"a$p$p"},doc:{fa:"file-text",tag:"d$o$c"},web:{fa:"globe",tag:"w$e$b"}},
	extended = {},
    blockCount = 0,
    blockCounter = 0,
    filter = [];

function getView(name, callback) {
	$.get(VTRANS_API + "legos/_table/views?fields=*&related=*&order=layout_order asc&filter=view%3D" + name + "&api_key=" + API_KEY, function (response) {
        blockCount = response.resource.length;
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
                icons: [],
				blockId: 'block' + Math.random().toString().substring(4) + "-" + Math.random().toString().substring(3)
			};
			console.log(block);
			extended[block.blockId] = r.blocks.extended;
			
			$.each(r.tags, function (i, tag) {				            
                if (tag.tag in tagIcons){                 
                    block.icons.push('<i class="v-icons fa fa-' + tagIcons[tag.tag].fa + '" data-tags="' + tagIcons[tag.tag].tag + '" aria-hidden="true"></i>');               
                }else{
                    block.tags.push(tag.tag); 
                }
			});
            block.icons.sort(); // keep some kind of visual consistancy
            block.tags.sort(); 
            
			callback(block);
		});
	});
}

function createBrick(brick) {
	var firstNumber = /(\d+)/, // finds the first number, with no spaces, letters, etc.
		size = parseInt(firstNumber.exec(brick.className)[1]); //TODO different screen sizes?

	/* if (size + columns > 12) { // i don't think we need this anymore now that we're flexboxing.
		$('body .container-fluid.bricks').append('<div class="row">');
		columns = 0;
	}*/
	
	var $html = $(Mustache.render('<div class="brick {{className}}" data-tags="{{#tags}}{{.}} {{/tags}}"><div class="card"></div></div>', brick));
	$('body .container-fluid.bricks>.row:last-of-type').append($html);
	
	columns += size;
	return $html;
}

function fillBrick(brick, data, template) {
	var $html = $(Mustache.render(template, data));
	$('.card', $(brick)).append($html);
}

function prepSearch() {
	searchIndex = [];
	tags = [];
	$('.brick').each(function (i, v) {
		searchIndex[i] = $('.short:not(".btn")', v).text().toLowerCase();
		searchIndex[i] += " " + $('.extended:not(".btn")', v).text().toLowerCase();
		searchIndex[i] += " " + (extended[$('.card-text', $(this))[0].id]).toLowerCase();
		searchIndex[i] += " " + $('h4', v).text().toLowerCase();
		$('.brick-tag', v).each(function(j, v) { 
			searchIndex[i] += " " + $(v).text().toLowerCase(); 
			tags[i] += " " + $(v).text().toLowerCase(); 
		});
	});
	
	if ($('.nothingFound').length === 0) {
		$($('.brick')[0]).parent().append('<p class="nothingFound">no results match your search</p>');
	}
	
	$('.brick-tag').off().click(function() {
		search($(this).text(), true);
	});
}

function search(term, searchTags) {
	var searchLocation,
		found = 0;
	if (searchTags) {
		searchLocation = tags;
	} else {
		searchLocation = searchIndex;
	}
	$.each(searchLocation, function (i, content) {
		if (content.toLowerCase().indexOf(term.toLowerCase()) < 0) { 
			$('.brick').eq(i).hide("fast");
            console.log($('.brick').eq(i));
		} else if (checkFilter($('.brick').eq(i))) { // only search filtered content?         
			$('.brick').eq(i).show("fast");
			found++;
		}
	});
	
	if (!found) {
		$('.nothingFound').show("fast");
	} else {
		$('.nothingFound').hide("fast");
	}
	
}

function showExtended(el) {
	var $el = $(el).parents('.brick');
	
	if ($('.extended p', $el).text().length < 10 ) {
		$('.extended p', $el).html(extended[$('.card-text', $el)[0].id])
	}
	$el.removeClass('show-nano').removeClass('show-short').addClass('show-extended');
	setTimeout(function () {
		$('html, body').animate({
			scrollTop: $el.offset().top
		}, 250);
	},
	300);
}

function showShort(el) {
	var $el = $(el).parents('.brick');
	$el.removeClass('show-nano').addClass('show-short').removeClass('show-extended');
}

function showNano(el) {
	var $el = $(el).parents('.brick');
	$el.addClass('show-nano').removeClass('show-short').removeClass('show-extended');
}

function bricksFilledComplete(){
    prepSearch();
}

function createLeftMenu(){
    // section needs major refactoring.. i will get back to that once we know this is the direction we are going.

    var $html = "<div class='vtpMenu bi-wrapper'><button type='button' id='showVTransMenuLink' class='btn btn-link'><span style='text-decoration:underline;'>Show VTrans Menu</span> <i class='fa fa-chevron-circle-down' aria-hidden='true'></i></button></div>";
    $(".main-column.main-section").prepend($html);    
    
    $html = '<div class="card bg-faded float-left filterSection clearfix">'+
    '    <div class="form-check" style="padding:6px;">'+
    '    Filter on type:'+
    '    </div>'+
    '       <div class="form-check">'+
    '          <label class="form-check-label">'+
    '            <input class="form-check-input" type="checkbox" checked value="a$l$l">'+
    '            <i class="fa" aria-hidden="true"> Select All</i>'+
    '          </label>'+
    '        </div>'+
    '        <div class="form-check">'+
    '          <label class="form-check-label">'+
    '            <input class="form-check-input" type="checkbox" checked value="m$a$p">'+
    '            <i class="fa fa-map" aria-hidden="true"> Maps</i>'+
    '          </label>'+
    '        </div>'+
    '        <div class="form-check">'+
    '          <label class="form-check-label">'+
    '            <input class="form-check-input" type="checkbox" checked value="d$a$t$a">'+
    '            <i class="fa fa-database" aria-hidden="true"> Data</i>'+
    '          </label>'+
    '        </div>'+
    '        <div class="form-check">'+
    '          <label class="form-check-label">'+
    '            <input class="form-check-input" type="checkbox" checked value="c$h$a$r$t">'+
    '            <i class="fa fa-pie-chart" aria-hidden="true"> Dashboards and Charts</i>'+
    '          </label>'+
    '        </div>'+
    '       <div class="form-check"><label class="form-check-label"><input class="form-check-input" type="checkbox" checked value="a$p$p" /> <i aria-hidden="true" class="fa fa-cogs"> Applications</i> </label></div>'+
    '       <div class="form-check"><label class="form-check-label"><input class="form-check-input" type="checkbox" checked value="d$o$c" /> <i aria-hidden="true" class="fa fa-file-text"> Documents</i> </label></div>'+
    '       <div class="form-check"><label class="form-check-label"><input class="form-check-input" type="checkbox" checked value="w$e$b" /> <i aria-hidden="true" class="fa fa-globe"> Websites</i> </label></div>'+
    '   </div>'+
    '</div>';
    
    $(".vtpMenu").append($html); 
    
    
    
    $html = '<div class="row tags clearfix tagSection">'+
    '<div class="tagWrap">'+
    '	<button class="btn btn-sm btn-info">Bridges</button>'+
    '	<button class="btn btn-sm btn-info">Pavement</button>'+
    '	<button class="btn btn-sm btn-info">Safety</button>'+
    '	<button class="btn btn-sm btn-danger clear">Clear Search</button>'+
    '</div>'+
    '</div>';
	
    $(".vtpMenu").append($html); 
    
    $('#showVTransMenuLink').click(function() {
        if ($(".sidebars section").css("display") === "none"){
            $(".sidebars section").css("display","block");
            $(this).html("<span style='text-decoration:underline;'>Hide VTrans Menu</span> <i class='fa fa-chevron-circle-up' aria-hidden='true'></i>");
            $(".vtpMenu").appendTo(".sidebars section");
            $(".vtpMenu").css("float","inherit");
            $(".vtpMenu").css("width","100%");
        }else{
            $(".sidebars section").css("display","none");
            $(this).html("<span style='text-decoration:underline;'>Show VTrans Menu</span> <i class='fa fa-chevron-circle-down' aria-hidden='true'></i>");
            $(".vtpMenu").prependTo(".main-column.main-section");
            $(".vtpMenu").css("float","left");
            $(".vtpMenu").css("width","20%");
            $("html, body").animate({ scrollTop: 0 }, "fast");
        }
	});
    
    var mql = window.matchMedia("(max-width: 600px)");
    if (mql.matches){
        $(".vtpMenu").prependTo(".container-fluid.bricks");
        $(".vtpMenu").css("float","inherit");
    }
    mql.addListener(function(event) {
        if(event.matches) {
            $(".vtpMenu").insertBefore(".container-fluid.bricks");
            $(".vtpMenu").css("float","inherit");
            $(".vtpMenu").css("width","100%");
        } else {
            $(".vtpMenu").prependTo(".main-column.main-section");
            $(".vtpMenu").css("width","20%");
            $(".vtpMenu").css("float","left");
        }
    });
}

function createHelp(){
    var $html = ' <i class="fa fa-question-circle" id="helpIcon" aria-hidden="true"></i>'
    $("#subTitle").append($html);
    
    $('#helpIcon').click(function() {
       showHelp();
	});
  
}

function showHelp(){
    // some modal or something
}

// remove item from array via string
function removeStringFromArray(arr, what) {
    var found = arr.indexOf(what);
    while (found !== -1) {
        arr.splice(found, 1);
        found = arr.indexOf(what);
    }
}

//after a checkbox has changed state, process the filter
function processFilter(){
    var block, found, ct;
    $(".brick").each(function (i) {
        block = $(this);
        found = false;
        ct = 0; // ignoring blocks without any icons. Not sure if this is best or not. They should probably all have at least one anyway.
		$(".v-icons", this).each(function(i){
            ct++;
            if ($.inArray(this.attributes["data-tags"].value,filter) > -1){
                block.show("fast");
                found = true;                           
            }          
            if (found){        
                return;
            }
        });
        if (found){        
            if (checkSearch(block)){
                block.show("fast");
            }             
        }else{
            if (ct > 0){
                block.hide("fast"); 
            }
        }
	});
}

//toggles all filter checkboxes
function toggleAllFilterItems(isChecked){
    if (isChecked){
        $(".brick").each(function (i) {
            $(this).show("fast");
        });
        fillFilter();
    }else{
        $(".brick").each(function (i) {
            $(this).hide("fast");
        });
        filter = [];           
    }
    $(".filterSection :checkbox").each(function () {
        $(this).prop('checked', isChecked);
    });
}

//load the filter array with all icon tags
function fillFilter(){
    filter = [];
    for (var prop in tagIcons) {
        if (tagIcons.hasOwnProperty(prop)) {
            filter.push(tagIcons[prop].tag);
        }
    }
}

//Search only filtered content
function checkFilter(block){
    var found = false, ct=0;
    $(".v-icons", block).each(function(i){
        ct++;
        if ($.inArray(this.attributes["data-tags"].value,filter) > -1){           
            found = true; 
            return;
        }       
    });
    if (found || ct === 0){        
         return true;             
    }else{
        return false;
    }
}

function checkSearch(block){
    //no search text exists
    if ($('#brickSearch').val() == ""){
        return true;
    }
    
    // search text exists.
    // need to check if the block should still be displayed based on search given the filter.
   
    
    
}

//Search box key-up delay
function debounce(fn, delay) {
  var timer = null;
  return function () {
    var context = this, args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, delay);
  };
}

$(document).ready(function() {
    getView(view, function(data) {     
        var $brick = createBrick(data);
        $.get(data.template, function (template) {
            fillBrick($brick, data, template);
            blockCounter++;
            if (blockCounter >= blockCount){ 
                bricksFilledComplete();
            }
        });
    });
    
    createLeftMenu();
    
    createHelp();
  
	$('#brickSearch').keyup(debounce(function() {
		$('.tags .btn:not(.clear)').addClass('btn-info').removeClass('btn-primary');
		search($(this).val());
	}, 250));
	$('.tags .btn:not(.clear)').click(function () {
		$('.tags .btn:not(.clear)').addClass('btn-info').removeClass('btn-primary');
		$(this).removeClass('btn-info').addClass('btn-primary');
		search($(this).text(), true);
	});
	$('.tags .btn.clear').click(function () {
		$('.tags .btn:not(.clear)').addClass('btn-info').removeClass('btn-primary');
		$('#brickSearch').val('');
		search('');
	});
    
    fillFilter();
    
    $(".filterSection").on('change', ':checkbox', function() {
        var val = this.value;
        if (val =="a$l$l"){            
            toggleAllFilterItems(this.checked);                    
            return;
        }
        if(this.checked) {
            filter.push(val);
        }
        else{
            removeStringFromArray(filter, val);
        }
        processFilter();
    });
    
});	
