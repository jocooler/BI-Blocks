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
        $('<iframe>', {src: Settings.vtpPath,
           "class": 'textOnlyFrame', frameborder: 0, scrolling: 'no'}).insertAfter(".bi-wrapper");
        $("#linkTextVersion a").attr("href",Settings.vtpPath);
        $("#linkTextVersion a").text("Interactive Version");
        return;
    }
    
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
        this.createHelpModal();
        
        var that = this; //just aliasing 'this' for the events
        
        $('#brickSearch').keyup(Utils.debounce(function() {
            $('.tags .btn:not(.clear)').addClass('btn-info').removeClass('btn-primary');
            that.search($(this).val());
            ga('send', 'event', 'Search', 'click', $(this).val().trim());
        }, 250));
        
        $('.tags .btn:not(.clear)').click(function () {
            $('.tags .btn:not(.clear)').addClass('btn-info').removeClass('btn-primary');
            $(this).removeClass('btn-info').addClass('btn-primary');
            that.search($(this).text(), "tags");
            ga('send', 'event', 'Search', 'click', $(this).text().trim());
        });
        
        $('.tags .btn.clear').click(function () {
            $('.tags .btn:not(.clear)').addClass('btn-info').removeClass('btn-primary');
            $('#brickSearch').val('');
            that.resetBlockVisibility();
            that.search('');
            ga('send', 'event', 'Search', 'click', 'clear');
        });
        
        $('#helpIcon').click(function() {
            $('#vtpHelpModal').modal('show');
            ga('send', 'event', 'Help', 'click', 'show');
        }); 
        
        $(".jq-dropdown-menu").on('click', 'a', function() {
            that.processFilter($(this));
            var html = $("i", $(this))[0];
            $("#filterButton span").each(function(){
                this.innerHTML = html.innerHTML;          
            });
            ga('send', 'event', 'Filter', 'click', html.innerHTML.trim());
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
                        link: r.blocks.link,
						info: r.blocks.info,
						subtitle: r.blocks.subtitle,
                        id: 'block' + Math.random().toString().substring(4) + "-" + Math.random().toString().substring(3),
                        tagSet: r.tags
                    };
                    var block = new Block(params);
                    block.init();
                    this.blocks.push(block);                
                    if (blockCount >= this.blocks.length){ 
                        this.blocksFilledComplete();
                    }
               }, this));
            }, this));
        }, this));
    }

    this.blocksFilledComplete = function(){
        var that = this;       
        $('.brick-tag').off().click(function() {
            that.search($(this).text(), "tags");           
            ga('send', 'event', 'TagFilter', 'click', $(this).text().trim());
        });
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
        var html = '<div id="filterSelect">Within: <a href="#" data-jq-dropdown="#jq-dropdown-1" id="filterButton"><span>All Types</span> <i class="fa fa-chevron-circle-down" aria-hidden="true"></i></a>'+
        '<div id="jq-dropdown-1" class="jq-dropdown jq-dropdown-relative">'+
        '    <ul class="jq-dropdown-menu">'+
        '        <li><a href="javascript:;" data-tags="a$l$l"><i class="fa">All</i></a></li>'+
        '        <li><a href="javascript:;" data-tags="m$a$p"><i class="fa fa-map" aria-hidden="true"> Maps</i></a></li>'+
        '        <li><a href="javascript:;" data-tags="d$a$t$a"><i class="fa fa-database" aria-hidden="true"> Data</i></a></li>'+
        '        <li><a href="javascript:;" data-tags="c$h$a$r$t"><i class="fa fa-pie-chart" aria-hidden="true"> Dashboards and Charts</i></a></li>'+
        '        <li><a href="javascript:;" data-tags="a$p$p"><i aria-hidden="true" class="fa fa-cogs"> Applications</i></li>'+
        '        <li><a href="javascript:;" data-tags="d$o$c"><i aria-hidden="true" class="fa fa-file-text"> Documents</i></a></li>'+
        '        <li><a href="javascript:;" data-tags="w$e$b"><i aria-hidden="true" class="fa fa-globe"> Websites</i></a></li>'+
        '    </ul>'+
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
            }else{
                this.blocks[i].hide(); 
            }
        }        
        this.checkNotFound();
    }
    
    this.createTagButtons = function(){
        var html = '<div class="row tags clearfix tagSection">'+
        '<div class="tagWrap">'+
        '	<button class="btn btn-sm btn-info">Bridges</button>'+
        '	<button class="btn btn-sm btn-info">Pavement</button>'+
        '	<button class="btn btn-sm btn-info">Safety</button>'+
        '	<button class="btn btn-sm btn-info">Projects</button>'+
        '	<button class="btn btn-sm btn-info">Maintenance</button>'+
        '	<button class="btn btn-sm btn-info">Winter</button>'+
        '	<button class="btn btn-sm btn-danger clear">Clear Search</button>'+
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
        $("#filterButton span").each(function(){
                this.innerHTML = "All";          
        });
    }
    
    this.createHelpModal = function(){
        
        var html = '<div class="modal fade" id="vtpHelpModal" tabindex="-1" role="dialog" aria-labelledby="vtpHelpTitle" aria-hidden="true">'+
        '  <div class="modal-dialog modal-lg" role="document">'+
        '    <div class="modal-content">'+
        '      <div class="modal-header">'+
        '        <h5 class="modal-title" id="vtpHelpTitle">VTransparency Help</h5>'+
        '        <button type="button" class="close" data-dismiss="modal" aria-label="Close">'+
        '          <span aria-hidden="true">×</span>'+
        '        </button>'+
        '      </div>'+
        '      <div class="modal-body">'+
        '		<p>Welcome to VTransparency, the Vermont Agency of Transportation information portal. VTransparency exists to give the public access to data-driven answers and analytics of our performance. Included are maps, performance reports, dashboards, query tools, and data sets each accompanied by narrative to describe what the data means and what our goals are. The data we track is organized into "cards" for easy reference. To see what the card contains, click the Learn More button. '+
		'		</p><p> '+
		'		The simplest way to find data is to search for the topic - like "crashes" or "pavement". Use the search box and any cards not about your search will disappear. Click the Learn More button to see more information, more detailed reports, and maps. To clear your search, use the red Clear Search button.' +
		'		</p><p> ' +
		'		Another way to find relevant cards is to use the tags at the bottom of each card. Click the tags to see other cards on the same topic.'+
		'		</p><p>'+
		'		Each card has a series of icons at the bottom to show what type of data or visualization it contains. You can search for a particular kind using the Within dropdown - for example, see all the maps we\'ve published as a part of VTransparency. Use the Clear Search button to return to the full view.'+
		'		</p>'+
		'		'+
        '      </div>'+
        '      <div class="modal-footer">'+
        '        <button type="button" class="btn btn-primary" data-dismiss="modal">Close</button>'+
        '      </div>'+
        '    </div>'+
        '  </div>'+
        '</div>';
        $(".bi-wrapper").append($(html));
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
    }
    
    Block.prototype.init = function (){
        this.setTags();
        this.buildSearchableText();
        this.create();
        this.fill();
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
        $('body .container-fluid.bricks>.row:last-of-type').append(this.domNode);
        
    };
    
    Block.prototype.fill = function (){
        var $html = $(Mustache.render(this.template, this));
        $('.card', $(this.domNode)).append($html);
    };
    
    Block.prototype.buildSearchableText = function (){
        this.searchableText = this.title.toLowerCase();
        this.searchableText += this.short.toLowerCase();
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
    
    Block.prototype.showShort = function (){        
        $('#closeExtended', this.domNode).off().remove();
        this.domNode.removeClass('show-nano').addClass('show-short').removeClass('show-extended');
        this.isExtended = false;
        var temp = this.domNode;
        setTimeout(function () {
            $('html, body').animate({
                scrollTop: temp.offset().top
            }, 250);
        }, 100);
    };
   
    Block.prototype.showExtended = function (){
        if ($('.extended p', this.domNode).text().length < 10 ) {
            $('.extended p', this.domNode).html(this.extended);
            this.extended = undefined;
        }
        this.domNode.removeClass('show-nano').removeClass('show-short').addClass('show-extended');
        $('.card-block', this.domNode).prepend('<span class="fa fa-compress" id="closeExtended" data-toggle="tooltip" title="collapse card" aria-hidden="true"></span>');
        $("#closeExtended").click($.proxy(function(){this.showShort();},this));
        var temp = this.domNode;
        setTimeout(function () {
            $('html, body').animate({
                scrollTop: temp.offset().top
            }, 250);
        }, 100);
        this.isExtended = true;
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

function showExtended(el) {    
	var block = vtp.getBlockByChildElement(el);
    block.showExtended();
    ga('send', 'event', 'BlockExpand', 'click', block.title.trim());
}

function showShort(el) {
	var block = vtp.getBlockByChildElement(el);
    block.showShort();
    ga('send', 'event', 'BlockCollapse', 'click', block.title.trim());
}


// dropdown plugin - bootstrap 4.0.6 dropdowns are broken
/*
 * jQuery Dropdown: A simple dropdown plugin
 *
 * Contribute: https://github.com/claviska/jquery-dropdown
 *
 * @license: MIT license: http://opensource.org/licenses/MIT
 *
 */
jQuery&&function($){function t(t,e){var n=t?$(this):e,d=$(n.attr("data-jq-dropdown")),a=n.hasClass("jq-dropdown-open");if(t){if($(t.target).hasClass("jq-dropdown-ignore"))return;t.preventDefault(),t.stopPropagation()}else if(n!==e.target&&$(e.target).hasClass("jq-dropdown-ignore"))return;o(),a||n.hasClass("jq-dropdown-disabled")||(n.addClass("jq-dropdown-open"),d.data("jq-dropdown-trigger",n).show(),r(),d.trigger("show",{jqDropdown:d,trigger:n}))}function o(t){var o=t?$(t.target).parents().addBack():null;if(o&&o.is(".jq-dropdown")){if(!o.is(".jq-dropdown-menu"))return;if(!o.is("A"))return}$(document).find(".jq-dropdown:visible").each(function(){var t=$(this);t.hide().removeData("jq-dropdown-trigger").trigger("hide",{jqDropdown:t})}),$(document).find(".jq-dropdown-open").removeClass("jq-dropdown-open")}function r(){var t=$(".jq-dropdown:visible").eq(0),o=t.data("jq-dropdown-trigger"),r=o?parseInt(o.attr("data-horizontal-offset")||0,10):null,e=o?parseInt(o.attr("data-vertical-offset")||0,10):null;0!==t.length&&o&&t.css(t.hasClass("jq-dropdown-relative")?{left:t.hasClass("jq-dropdown-anchor-right")?o.position().left-(t.outerWidth(!0)-o.outerWidth(!0))-parseInt(o.css("margin-right"),10)+r:o.position().left+parseInt(o.css("margin-left"),10)+r,top:o.position().top+o.outerHeight(!0)-parseInt(o.css("margin-top"),10)+e}:{left:t.hasClass("jq-dropdown-anchor-right")?o.offset().left-(t.outerWidth()-o.outerWidth())+r:o.offset().left+r,top:o.offset().top+o.outerHeight()+e})}$.extend($.fn,{jqDropdown:function(r,e){switch(r){case"show":return t(null,$(this)),$(this);case"hide":return o(),$(this);case"attach":return $(this).attr("data-jq-dropdown",e);case"detach":return o(),$(this).removeAttr("data-jq-dropdown");case"disable":return $(this).addClass("jq-dropdown-disabled");case"enable":return o(),$(this).removeClass("jq-dropdown-disabled")}}}),$(document).on("click.jq-dropdown","[data-jq-dropdown]",t),$(document).on("click.jq-dropdown",o),$(window).on("resize",r)}(jQuery);