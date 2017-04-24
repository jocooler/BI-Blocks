##BI Legos##
=============
A modular, reuseable, customizable approach to Business Intelligence under development for VTrans.

Powered by DreamFactory.


Front End Development
-----------------

*Bricks* are made up of:
	

	<div class="col-md-12 brick">
		<div class="card">
			<div class="card-block">${content}</div>
		</div>
	</div>

		
Any brick can be customized by users:

* Width - 1 -> 12, correspond to default bootstrap breakpoints. At lg and xl they will be the number specified. Mediums over 6 -> 12, under 6 -> 6, smalls over 3 -> 12, under 3 -> 6, extra smalls to 12.
* Height - auto or vh or px (chosen from list). Overflow: scroll.
* Extended or Short or Micro

**Do we use Shadow Dom for these to keep stuff clean?**
		
*Contents* are Mustache enabled HTML templates designed knowing they will live in bootstrap cards. 
	
* Content can be any HTML. 
* We'll probably need some kind of validation so we know they aren't going to break everything else.
* Content can be edited by any editor who has access to them.
		
* Short
* Extended (optional, use short for default)
* Title
* Link to other report/more
			
Data connected. This will require the Word thing or something similar - maybe a namespaced callback?
Widget Gallery for building views.
	
Backend Development
-------------------

* Dreamfactory App + App DB
* Save your widget layout
* Save your content chages
* Save bricks HTML templates
* Data connections
	
Self-service Widgets
-------------------

* Use Word for Templates
* Template Validator
* Template Data Connector


https://vtransapi.aot.state.vt.us/api/v2/legos/_table/views?fields=*&related=*&filter=view%3DDemo%20View%201

(C) 2016 SoV VTrans, MIT Licensed