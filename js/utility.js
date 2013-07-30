

$(document).ready(function () {
							
	
	$('#accordion-1').easyAccordion({ 
			autoStart: true, 
			slideInterval: 3000
	});
	
	$('#accordion-2').easyAccordion({ 
			autoStart: false	
	});
	
	$('#accordion-3').easyAccordion({ 
			autoStart: true,
			slideInterval: 5000,
			slideNum:false	
	}); 
	
	$('#accordion-4').easyAccordion({ 
			autoStart: false,
			slideInterval: 5000
	}); 
		

});