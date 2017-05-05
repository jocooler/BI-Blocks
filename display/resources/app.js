"use strict";

function Vtp(v) {
    this.view = v;
    this.blocks = [];
    this.filter = [];
    this.target = '';
	this.API_KEY = 'd1b885b8d202ab320717b54d9265e360db151e69be811f38da2f24fdd09333a5';
	this.VTRANS_API = 'https://vtransapi.aot.state.vt.us/api/v2/';
    
    this.init = function(){
        this.getView();
        this.createLeftMenu();
        this.fillFilter();

        
        var that = this; //just aliasing 'this' for the events
        $('#brickSearch').keyup(Utils.debounce(function() {
            $('.tags .btn:not(.clear)').addClass('btn-info').removeClass('btn-primary');
            that.search($(this).val());
        }, 250));
        $('.tags .btn:not(.clear)').click(function () {
            $('.tags .btn:not(.clear)').addClass('btn-info').removeClass('btn-primary');
            $(this).removeClass('btn-info').addClass('btn-primary');
            that.search($(this).text(), "tags");
        });
        $('.tags .btn.clear').click(function () {
            $('.tags .btn:not(.clear)').addClass('btn-info').removeClass('btn-primary');
            $('#brickSearch').val('');
            that.search('');
        });
        $('#helpIcon').click(function() {
           // todo: create some kind of help modal?
        });
        $(".filterSection").on('change', ':checkbox', function() {
            var val = this.value;
            if (val =="a$l$l"){            
                that.toggleAllFilterItems(this.checked);                    
                return;
            }
            if(this.checked) {
                that.filter.push(val);
            }
            else{
                Utils.removeStringFromArray(that.filter, val);
            }
            that.processFilter();
        });
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
                        extended: r.blocks.extended,                  
                        id: 'block' + Math.random().toString().substring(4) + "-" + Math.random().toString().substring(3),
                        tagSet: r.tags
                    };
                    var block = new Block(params);
                    block.init();
                    block.create();
                    block.fill();
                    this.blocks.push(block);                
                    if (blockCount >= this.blocks.length){ 
                        this.blocksFilledComplete();
                    }
               }, this));
            }, this));
        }, this));
    }

    this.blocksFilledComplete = function(){
               
        $('.brick-tag').off().click(function() {
            search($(this).text(), true);
        });
        
        this.shoreUpMemory(); // maybe not necessary?
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
    
    this.shoreUpMemory = function(){
        for (var i = 0; i < this.blocks.length; i++){
            this.blocks[i].deletePropertiesNoLongerNeeded();
        }
    }
    
    this.search = function(term, searchWhat){        
        if (searchWhat == "tags") {
            $.each(this.blocks, function(){
                if (this.searchableTags.indexOf(term.toLowerCase()) < 0) { 
                    this.hide();
                }else{
                    this.show();
                }
            });           
        } else {
            $.each(this.blocks, function(){
                if (this.searchableText.indexOf(term.toLowerCase()) < 0) { 
                    this.hide();
                }else{
                    this.show();
                }
            });           
        }
        
        this.checkNotFound();
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
    
    this.fillFilter = function(){
        for (var prop in tagIcons){
            if (tagIcons.hasOwnProperty(prop)) {
                this.filter.push(tagIcons[prop].tag);
            }
        }
    }
    
    this.toggleAllFilterItems = function(isChecked){
        if (isChecked){
            for (var i = 0; i < this.blocks.length; i++){
                this.blocks[i].show();
            }
            this.fillFilter();
        }else{
            for (var i = 0; i < this.blocks.length; i++){
                this.blocks[i].hide();
            }
            this.filter = [];           
        }
        $(".filterSection :checkbox").each(function () {
            $(this).prop('checked', isChecked);
        });
        
        this.checkNotFound();
    }
    
    this.processFilter = function(){
        var block,
            found = false;
        for (var i = 0; i < this.blocks.length; i++){
            found = false;
            block = this.blocks[i];
            $.each(block.iconTags, $.proxy(function(i){             
                if (this.filter.indexOf(block.iconTags[i]) > -1){
                    block.show();  
                    found = true;
                    return;
                }              
            },this)); 
            if (!found){
                block.hide();
            }
        }
        
        this.checkNotFound();
    }
    
    this.createLeftMenu = function(){
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
        
        $('#showVTransMenuLink').click(function(){
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
        this.extended = params.extended;
        this.searchableText = "";
        this.searchableTags = "";
        this.template = params.template;
        this.domNode = null;
        this.isExtended = false;
    }
    
    Block.prototype.init = function (){
        this.setTags();
        this.buildSearchableText();        
    };

    Block.prototype.getTags = function (){
        return this.tags;
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
        this.searchableText += this.extended.toLowerCase()
        $.each(this.tags, $.proxy(function(i){
            this.searchableText += this.tags[i];
            this.searchableTags += this.tags[i];
        },this));
    };
        
    Block.prototype.deletePropertiesNoLongerNeeded = function (){
        this.short = undefined;        
        this.tagSet = undefined;
        this.template = undefined;
        this.query = undefined;
        this.icons = undefined;
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
        this.domNode.removeClass('show-nano').addClass('show-short').removeClass('show-extended');
        this.isExtended = false;
    };
   
    Block.prototype.showExtended = function (){
        if (this.isExtended) {
            $('.extended p', this.domNode).html(this.extended)
        }
        this.domNode.removeClass('show-nano').removeClass('show-short').addClass('show-extended');
        var temp = this.domNode;
        setTimeout(function () {
            $('html, body').animate({
                scrollTop: temp.offset().top
            }, 250);
        }, 300);
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
    }    
}

/************ Window *************/

var tagIcons = {chart:{fa:"pie-chart",tag:"c$h$a$r$t"}, map:{fa:"map",tag:"m$a$p"},data:{fa:"database",tag:"d$a$t$a"},app:{fa:"cogs",tag:"a$p$p"},doc:{fa:"file-text",tag:"d$o$c"},web:{fa:"globe",tag:"w$e$b"}};

function showExtended(el) {    
	var block = vtp.getBlockByChildElement(el);
    block.showExtended();
}

function showShort(el) {
	var block = vtp.getBlockByChildElement(el);
    block.showShort();
}