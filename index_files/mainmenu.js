$(document).ready(function(){
	
	$(".topnav li span.topnav").click(function() { //When trigger is clicked...
		
		//Following events are applied to the subnav itself (moving subnav up and down)		
		$(this).parent().find("ul.subnav").show(); //Drop down the subnav on click
		$(this).parent().hover(function() {  
		}, function(){	
			$(this).parent().find("ul.subnav").hide(); //When the mouse hovers out of the subnav, move it back up
		});

		//Following events are applied to the trigger (Hover events for the trigger)
		}).hover(function() { 
			$(this).addClass("subhover"); //On hover over, add class "subhover"
		}, function(){	//On Hover Out
			$(this).removeClass("subhover"); //On hover out, remove class "subhover"
	});

});

