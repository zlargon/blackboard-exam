Event.observe(document,"dom:loaded", function() {
	var receiptTag = $("bbNG.receiptTag.content");
	if(receiptTag != null) {
		var takeAgainContainer = $("takeAgainContainer");
		receiptTag.insert(takeAgainContainer);
		
		var takeAgainBtn = takeAgainContainer.down("#takeAgainBtn");
		var takeAgainHref = receiptTag.down("a").href;
		Event.observe(takeAgainBtn, "click", function() {
			window.location = takeAgainHref;
		});
		
		var viewResultsBtn = takeAgainContainer.down("#viewResultsBtn");
		var viewResultsHref = $$(".backLink a").first().href;
		Event.observe(viewResultsBtn, "click", function() {
			window.location = viewResultsHref;
		});
		
		takeAgainContainer.show();
	}
});