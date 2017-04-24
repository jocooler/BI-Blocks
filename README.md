##BI Legos##
=============
A modular, reuseable, customizable approach to Business Intelligence under development for VTrans.

Powered by DreamFactory.

Displaying
=========
1. Put the code in demo.html into the placeholder within your page where you'd like the BI Legos to be built. 
2. Update the view name (`var view`) with the view you're interested in displaying.

[demo](http://jocooler.github.io/BI-Blocks/display/demo.html)

Building
=============
This is a big TODO. At the moment use the forms in the DreamFactory admin.

Data Structure:

Views 1:1 Blocks 1:* Tags

1. Build any new blocks.

* id: autofilled, leave blank
* name: the title of the block
* template: the html template file. These are currently stored at http://www.aot.state.vt.us/legos/display
* query: what this is will depend on the template, but it's probably a URL to the KPI, image, etc.
* short: the short description for the KPI; text only. This is display initially.
* extended: the expanded text. Can include html, etc. Displayed using the Learn More button.
* security: 0 = public facing, 1 = internal only, other groups might be created later.

Once you get the block made, make note of the ID. You'll need this to get the tables to work.

2. Add the tags.

* id: autofilled, leave blank
* block: the block id the tag should be associated with
* tag: the tag. Enter one per row, so if you want to tag the block with projects and closures, create two rows.

3. Add the blocks to the view.

* id: autofilled, leave blank
* view: the view name. All rows for a view must have the same view name.
* block: the block id 
* layout order: an integer with the order for display.
* class name: generally use col-lg-4 col-md-6 col-sm-12, but you can change the default size here for making a dashboard. 

You'll need to add a row to the views table for each block.

Templates
------------

So far, these are the available templates.

1. Frame: PowerBI, chart server, maps, other framed sources http://www.aot.state.vt.us/documents/lego-templates/frame.html
* Query should be the full URL to the resource. If you're using the chart server, see the documentation there about building the URL.
2. Image: for displaying static images http://www.aot.state.vt.us/documents/lego-templates/image.html
* Query should be the URL to the image.

If a KPI requires data processing on the client machine, you can create a new template for it. The reason for this is that passing javascript to the client via URL or POST data is fundamentally insecure, so creating a new template is the only choice here. 

The templates are [Mustache](https://github.com/janl/mustache.js/) files. It is suggested to use Query to specify the (REST API?) data source for modularity. Any processing can happen in the script and display can be accomplished using the chart server or [C3.js](http://c3js.org/), our charting framework of choice. You can also use whatever library you want.

(C) 2017 SoV VTrans, MIT Licensed, Josiah Raiche lead developer