"use strict";

var Settings = {    
    apiPath : "https://vtransapi.aot.state.vt.us/api/v2/",
    apiKey : "d1b885b8d202ab320717b54d9265e360db151e69be811f38da2f24fdd09333a5",
    textVersionPath : "http://www.aot.state.vt.us/vtpplain/plain.aspx",
    vtpPath : "/content/vtp",
    vtpView : "Demo View 1"
};

function load(){    
	$(".row").html(""); //drupal likes to insert &nbsp; into empty containers when editing the page and im tired of forgetting and having to delete it.
    $("#linkTextVersion").css("display","inline"); // initially hidden incase js is disabled or viewing textonly.
    
    if (Utils.getParameterByName("t") == "1"){ // check for text only version and load iframe if so.       
        $('<iframe>', {src: Settings.textVersionPath,
           "class": 'textOnlyFrame', frameborder: 0, scrolling: 'no'}).insertAfter(".bi-wrapper");
        $("#linkTextVersion a").attr("href",Settings.vtpPath);
        $("#linkTextVersion a").text("Interactive Version");
        return;
    }
    
    $("#page-title").html("<img src='http://www.aot.state.vt.us/legos/display/resources/pics/vtp4.png' alt='VTransparency'/>");
    $(".bi-wrapper").css("display","block"); // initially hidden incase js is disabled or viewing textonly.
    $("#brickSearch").css("display","inline-block"); // initially hidden incase js is disabled or viewing textonly.
    
    var vtp = new Vtp(Settings.vtpView);
    vtp.init();    
}

function Vtp(v) {
    this.view = v;
    this.blocks = [];
    this.target = '';
	this.API_KEY = Settings.apiKey;
	this.VTRANS_API = Settings.apiPath;
    
    this.init = function(){
        this.getView();
        this.createFilter();
        this.createTagButtons();
        
        var that = this; //just aliasing 'this' for the events
        
        $('#brickSearch').keyup(Utils.debounce(function() {
            $('.tags .btn:not(.clear)').addClass('btn-info').removeClass('btn-primary');
            that.search($(this).val());
            ga('send', 'event', 'vtpSearch', 'click', $(this).val().trim());
        }, 250));
        
        $('.tags .btn:not(.clear)').click(function () {
            $('.tags .btn:not(.clear)').addClass('btn-info').removeClass('btn-primary');
            $(this).removeClass('btn-info').addClass('btn-primary');
            that.search($(this).text(), "tags");
            ga('send', 'event', 'vtpSearch', 'click', $(this).text().trim());
        });
        
        $('.tags .btn.clear').click(function () {
            $('.tags .btn:not(.clear)').addClass('btn-info').removeClass('btn-primary');
            $('#brickSearch').val('');
            that.resetBlockVisibility();
            that.search('');
            ga('send', 'event', 'vtpSearch', 'click', 'clear');
        });
        
        
        $(".dropdown-menu").on('click', 'a', function() {
            that.processFilter($(this));
            var item = $("span", $(this))[0];
            $("#dropdownMenu").each(function(){
                this.innerHTML = item.innerHTML;          
            });
            ga('send', 'event', 'vtpFilter', 'click', item.innerHTML.trim());
        });
        
        $('[data-toggle="tooltip"]').tooltip(); //enable bootstrap tooltips
        
    }
    
    this.getView = function() {
        $.get(this.VTRANS_API + "legos/_table/views?fields=*&related=*&order=layout_order asc&filter=view%3D" + this.view + "&api_key=" + this.API_KEY, $.proxy(function (response) {
           var blockCount = response.resource.length;
		   $.each(response.resource, $.proxy(function (i, r) {
               $.get(r.blocks.template, $.proxy(function (template) {
                    var params = {
                        order: r.layout_order,
                        className: r.className + " show-short",
                        title: r.blocks.name,
                        template: template,
                        query: r.blocks.query,
                        short: r.blocks.short,
                        keywords: r.blocks.keywords,
                        link: r.blocks.link,
						info: r.blocks.info,
						subtitle: r.blocks.subtitle,
                        id: 'block' + Math.random().toString().substring(4) + "-" + Math.random().toString().substring(3),
                        tagSet: r.tags
                    };
                    var block = new Block(params);
                    block.init();
                    this.blocks.push(block);     
                    if (this.blocks.length >= blockCount){ 
                        this.blocksFilledComplete();
                    }
               }, this));
            }, this));
        }, this));
    }

    this.blocksFilledComplete = function(){
		this.renderBlocks();
        var that = this;       
        $('.brick-tag').off().click(function() {
            that.search($(this).text(), "tags");           
            ga('send', 'event', 'vtpTagFilter', 'click', $(this).text().trim());
        });	
    }
	
	this.renderBlocks = function() {
		// block order gets messed up due to async block template call. re-ordering.
		// other option is to place and order blocks as they come in?
		this.blocks = this.blocks.sort(function(a, b){
			var keyA = new Date(a.order),
				keyB = new Date(b.order);
			if(keyA < keyB) return -1;
			if(keyA > keyB) return 1;
			return 0;
		});	
		for (var i = 0; i< this.blocks.length; i++){
			this.blocks[i].render();
		}
	}
    
    this.numOfVisibleBlocks = function(){
        var ct = 0;
        for (var i = 0; i < this.blocks.length; i++){
            if (this.blocks[i].isVisible){
                ct++;
            }
        }
        return ct;
    }
    
    this.search = function(term, searchWhat){        
        if (searchWhat == "tags") {
            $.each(this.blocks, function(){
                if (this.searchableTags.indexOf(term.toLowerCase()) < 0) { 
                    this.searched = false;
                }else{
                    this.searched = true;
                }
            });           
        } else {
            $.each(this.blocks, function(){
                if (this.searchableText.indexOf(term.toLowerCase()) < 0) { 
                    this.searched = false;
                }else{
                    this.searched = true;
                }
            });           
        }        
        $('#brickSearch').val(term); // adds term to searchbox
        this.applyFilterAndSearchResults();         
    }
    
    this.checkNotFound = function(){
        if (this.numOfVisibleBlocks() === 0) {
            $('.nothingFound').show("fast");
        } else {
            $('.nothingFound').hide("fast");
        }
    }
    
    this.getBlockByChildElement = function(el){
        var $el = $(el).parents('.brick')[0];
        for (var i = 0; i < this.blocks.length; i++){
            if (this.blocks[i].id == $el.id){
                return this.blocks[i];
            }
        }
        return null;
    }
    
    this.createFilter = function(){ 
        var html = '<div class="dropdown" id="filterSelect">Within: <a href="#" class="dropdown-toggle" id="dropdownMenu" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">All Types</a>'+
        '<div class="dropdown-menu" aria-labelledby="dropdownMenu">'+
        '    <a href="javascript:;" class="dropdown-item" data-tags="a$l$l"><i class="fa fa-fw"> </i>&nbsp;&nbsp;<span>All Types</span></a>'+
        '    <a href="javascript:;" class="dropdown-item" data-tags="m$a$p"><i class="fa fa-fw fa-map" aria-hidden="true"></i>&nbsp;&nbsp;<span>Maps</span></a>'+
        '    <a href="javascript:;" class="dropdown-item" data-tags="d$a$t$a"><i class="fa fa-fw fa-database" aria-hidden="true"></i>&nbsp;&nbsp;<span>Data</span></a>'+
        '    <a href="javascript:;" class="dropdown-item" data-tags="c$h$a$r$t"><i class="fa fa-fw fa-pie-chart" aria-hidden="true"></i>&nbsp;&nbsp;<span>Dashboards and Charts</span></a>'+
        '    <a href="javascript:;" class="dropdown-item" data-tags="a$p$p"><i aria-hidden="true" class="fa fa-fw fa-cogs"></i>&nbsp;&nbsp;<span>Applications</span></a>'+
        '    <a href="javascript:;" class="dropdown-item" data-tags="d$o$c"><i aria-hidden="true" class="fa fa-fw fa-file-text"></i>&nbsp;&nbsp;<span>Documents</span></a>'+
        '    <a href="javascript:;" class="dropdown-item" data-tags="w$e$b"><i aria-hidden="true" class="fa fa-fw fa-globe"></i>&nbsp;&nbsp;<span>Websites</span></a>'+
        '</div></div>';
        $(html).insertAfter("#brickSearch");
    }

    this.processFilter = function(el){
        var val = el[0].attributes["data-tags"].value;  
        if (val === "a$l$l"){
            for (var i = 0; i < this.blocks.length; i++){               
                this.blocks[i].filtered = true;               
            }
        }else{        
            for (var i = 0; i < this.blocks.length; i++){
                if (this.blocks[i].iconTags.indexOf(val) > -1){
                    this.blocks[i].filtered = true;
                }else{
                    this.blocks[i].filtered = false;
                }
            }
        }
        this.applyFilterAndSearchResults();        
    }
    
    this.applyFilterAndSearchResults = function(){
        for (var i = 0; i < this.blocks.length; i++){
            if (this.blocks[i].filtered && this.blocks[i].searched){
                this.blocks[i].show();            
            } else if (this.blocks[i].title == 'Open Data Portal') { //always show open data portal
				this.blocks[i].show();
			}else{
                this.blocks[i].hide(); 
            }
        }        
        this.checkNotFound();
    }
    
    this.createTagButtons = function(){
        var html = '<div class="row tags clearfix tagSection">'+
        '<div class="tagWrap">'+
		'	<button class="btn btn-sm btn-info">Winter</button>'+
        '	<button class="btn btn-sm btn-info">Projects</button>'+
        '	<button class="btn btn-sm btn-info">Pavement</button>'+
        '	<button class="btn btn-sm btn-info">Safety</button>'+
        '	<button class="btn btn-sm btn-info">Bridges</button>'+
        '	<button class="btn btn-sm btn-info">Maintenance</button>'+
        '	<button class="btn btn-sm btn-info">Rail</button>'+
		'	<button class="btn btn-sm btn-info">Travel</button>'+
        '	<button class="btn btn-sm btn-danger clear">Reset All Filters</button>'+
        '</div>'+
        '</div>';
        $(html).insertBefore(".container-fluid.bricks");        
    }
    
    this.resetBlockVisibility = function(){
        for (var i = 0; i < this.blocks.length; i++){
            this.blocks[i].searched = true;
            this.blocks[i].filtered = true;
            this.blocks[i].isVisible = true;
        }
        
        //reset the selected filter to 'All'
        $("#dropdownMenu").each(function(){
                this.innerHTML = "All Types";          
        });
    } 
};



/********** Block *****************/

var Block = (function (params){
    function Block(params) {
        this.tags = [];
        this.icons = [];
        this.iconTags = [];
        this.tagSet = params.tagSet;
        this.id = params.id;
        this.isVisible = true;
        this.className = params.className;
        this.order = params.order;
        this.query = params.query;
        this.title = params.title;
        this.short = params.short;
        this.link = params.link;
		this.info = params.info;
		this.subtitle = params.subtitle;
        this.searchableText = "";
        this.searchableTags = "";
        this.template = params.template;
        this.domNode = null;
        this.isExtended = false;
        this.searched = true;
        this.filtered = true;
        this.keywords = params.keywords || "";
    }
    
    Block.prototype.init = function (){
        this.setTags();
        this.buildSearchableText();
        this.create();
        this.fill();
		this.events();
    };

    Block.prototype.setTags = function (){
        $.each(this.tagSet, $.proxy(function (i, tag) {				            
            if (tag.tag in tagIcons){                 
                this.icons.push('<i class="v-icons fa fa-' + tagIcons[tag.tag].fa + '" data-tags="' + tagIcons[tag.tag].tag + '" aria-hidden="true"></i>');               
                this.iconTags.push(tagIcons[tag.tag].tag);
            }else{
                this.tags.push(tag.tag); 
            }
        },this));
        this.icons.sort(); // keep some kind of visual consistancy
        this.tags.sort();
    };
    
    Block.prototype.create = function (){
        this.domNode = $(Mustache.render('<div class="brick {{className}}" id="{{id}}" data-tags="{{#tags}}{{.}} {{/tags}}"><div class="card"></div></div>', this));
    };
    
    Block.prototype.fill = function (){
        var $html = $(Mustache.render(this.template, this));
        $('.card', $(this.domNode)).append($html);
    };
	
	Block.prototype.events = function (){
		var link = this.link;
        $('.card-head', $(this.domNode)).click(function(){
			window.open(link,'_blank');			
		});
    };
	
	Block.prototype.render = function (){
        $('body .container-fluid.bricks>.row:last-of-type').append(this.domNode);
    };
    
    Block.prototype.buildSearchableText = function (){
        this.searchableText = this.title.toLowerCase();
        this.searchableText += this.short.toLowerCase();
        this.searchableText += this.keywords.toLowerCase();
        $.each(this.tags, $.proxy(function(i){
            this.searchableText += this.tags[i];
            this.searchableTags += this.tags[i];
        },this));
    };
    
    Block.prototype.hide = function () {
        this.domNode.hide("fast");
        this.isVisible = false;
    };
    
    Block.prototype.show = function () {
        this.domNode.show("fast");
        this.isVisible = true;
    };

    return Block;
}());

/**************** Utils ******************/

var Utils = {    
    debounce : function(fn, delay){
        var timer = null;
        return function () {
          var context = this, args = arguments;
          clearTimeout(timer);
          timer = setTimeout(function () {
            fn.apply(context, args);
          }, delay);
        };
    },    
    removeStringFromArray : function(arr, what) {
        var found = arr.indexOf(what);
        while (found !== -1) {
            arr.splice(found, 1);
            found = arr.indexOf(what);
        }
    },
    getParameterByName : function(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }    
}

/************ Window *************/

var tagIcons = {chart:{fa:"pie-chart",tag:"c$h$a$r$t"}, map:{fa:"map",tag:"m$a$p"},data:{fa:"database",tag:"d$a$t$a"},app:{fa:"cogs",tag:"a$p$p"},doc:{fa:"file-text",tag:"d$o$c"},web:{fa:"globe",tag:"w$e$b"}};