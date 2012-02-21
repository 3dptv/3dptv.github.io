// $Id: projects.js 3782 2010-10-21 11:16:23Z bherlig $

$("document").ready(function(){
    /*
     * Project view
     */
    $("td.project-summary").click(function(e) {
		var pid = this.getAttribute('project');
		var pRow = $('#project-' + pid);
        pRow.toggle();
		// Test on the td child:
		var pDesc = $('#project-' + pid + ' > td')[0];
		if(pDesc.className.indexOf('project-desctiption-loaded') < 0){
			// We have to load the description
			jQuery.get('ajax/get_project/'+pid, null, function(e){
				pDesc.innerHTML = "<img src='"+e.logo+"'/>"+e.description+"<br clear='both'/>";

				pDesc.innerHTML += "<ul>";
				pDesc.innerHTML += (e.license?"<li><strong>License:</strong> "+e.license+"</li>":"");
				pDesc.innerHTML += (e.operating_system?"<li><strong>OS:</strong> "+e.operating_system+"</li>":"");
				pDesc.innerHTML += (e.category?"<li><strong>Categories:</strong> "+e.category+"</li>":"");
				pDesc.innerHTML += (e.programming_language?"<li><strong>Programming Language:</strong> "+e.programming_language+"</li>":"");
				pDesc.innerHTML += "</ul>";
			}, 'json'); 
			pDesc.className += ' project-desctiption-loaded';
		}
		
		// And finally switch the image in the summary
		var summary = $(e.currentTarget);
		if(summary.is(".summary-collapsed"))
			summary.removeClass("summary-collapsed").addClass("summary-expanded");
		else
			summary.removeClass("summary-expanded").addClass("summary-collapsed");
    }).css({'cursor':'pointer'});
    
    /*
     * Release stuff:
     */
    // Behavioural collapsing of releases:
    $("tr.collapsed").css({'display':'none'});
    // The alternate image is in the alt tag, so toggle
    // visibility and switch the images:
    $("img.release-switcher").click(function(e) {
        $('.release' + this.getAttribute('release')).toggle();
        // Switch the images around
        var t = this.alt;
        this.alt = this.src;
        this.src = t;
    }).css({'cursor':'pointer'});
});