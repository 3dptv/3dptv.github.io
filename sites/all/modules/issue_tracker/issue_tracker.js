// $Id: issue_tracker.js 3900 2011-07-03 11:49:14Z bherlig $

Drupal.behaviors.issueTrackerFilterReset = function (context) {
  // reset links
  var main_resets = $('fieldset#filters').find('.clear-link').click(function() {
	resetInput(this);
  });
  $('fieldset#filters').find('#filter-text-reset').click(function() {
	resetInput(this);
  });
  
  // enable enter key on free-text field
  $('#filter-text').keypress(function(e) {
	var code = (e.keyCode ? e.keyCode : e.which);
	if (code == 13) { //Enter keycode
	  doFilter();
	}
  });
};

/**
 * Enables the saving of a filter through pressing enter.
 */
Drupal.behaviors.issueTrackerFilterAdd = function (context) {
	// enable enter key on free-text field
	$('#filter-save').keypress(function(e) {
		var code = (e.keyCode ? e.keyCode : e.which);
		if (code == 13) { //Enter keycode
		  addFilter();
		}
	}); 
};

/**
 * Add paging related functions, currently only variable-extraction.
 */
Drupal.behaviors.issueTrackerPaging = function (context) {
  var parameters = extractParameters(window.location.href);

  currentPage = parameters['page'];
  sortColumn = parameters['sortcolumn'];
  sortDirection = parameters['sortdirection'];
};

/**
 * The current page shown in the issue-table.
 */
var currentPage;

/**
 * The column that the issue table is currently sorted by.
 */
var sortColumn;

/**
 * The direction that the current column in the issue table is currently sorted by.
 */
var sortDirection;

/**
 * Show page number `page'.
 */
function showPage(page) {
  currentPage = page;
  applyFilter();
}

/**
 * Sort the issues by a column. The issues will be sorted in ascending order.
 * If you sort again by the same column, the issues will be sorted in descending order.
 */
function doSort(column) {
  if (sortColumn == column) {
    if (sortDirection == "desc")
      sortDirection = "asc";
    else
      sortDirection = "desc";
  }
  else {
    sortDirection = "asc";
    sortColumn = column;
  }
  applyFilter();
}

/**
 * Saves the current filter to the users preferences and updates the html page via ajax.
 */
function addFilter() {
  var filterName = $("#filter-save").val();

  if (filterName.length == 0) {
    alert("Please enter a name for your filter");
    $("#filter-save").focus();
  }
  else {
	var filterValues = getFilterValues(true);
	filterValues['action'] = 'add';
	filterValues['name'] = filterName;
	var getString = generateGETString(filterValues);

    $.get(Drupal.settings.basePath + "ajax/issue_filters" + getString, null, function(e) {
      var table = $("#personal-filters")[0];
      table.innerHTML = unescape(e);
    });
  }
}

/**
 * Deletes a saved filter and updates the html page via ajax.
 */
function deleteFilter(fid) {
  if (confirm("Do you want do delete this filter?")) {
    var getParameters = {};
    getParameters['action'] = 'delete';
    getParameters['fid'] = fid;
  
    var urlPostfix = generateGETString(getParameters);
	
    $.get(Drupal.settings.basePath + "ajax/issue_filters" + urlPostfix, null, function(e) {
      var table = $("#personal-filters")[0];
      table.innerHTML = unescape(e);
    });
  }
  
  return false;
}

/**
 * Utility function to retrieve parameters from a GET style url.
 * @return A map containing all the values in URL
 */
function extractParameters(url) {
  var splitted = url.split('&');
  var parameters = {};
  
  $.each(splitted, function() {
    var kv = this.split('=');

    if (kv[1] != null) {
	  parameters[kv[0]] = kv[1];
    }
  });

  return parameters;
}

/**
 * Resets all input fiels in the container "filters".
 */
function resetReload() {
  resetAll();
  doFilter();
}

/**
 * Reset all input fields.
 * Does not reload/re-apply the filters (use "resetReload()" instead).
 */
function resetAll() {
  $('fieldset#filters').find(':input').each(function() {
      switch(this.type) {
          case 'password':
          case 'select-multiple':
          case 'select-one':
          case 'text':
          case 'textarea':
              $(this).val('');
              break;
          case 'checkbox':
          case 'radio':
              this.checked = false;
      }
  });
}

/**
 * Set the selected values according to the parameters passed in urlPostfix and filters the issues.
 */
function filterFromParameters(urlPostfix) {
  var parameters = extractParameters(urlPostfix);
  urlPostfix = "?" + urlPostfix;

  resetAll();
  $.each(parameters, function(key, value) {
	switch(key) {
	 case 'page':
       currentPage = value;
       break;
	 case 'sortcolumn':
	   sortColumn = value;
	   break;
	 case 'sortdirection':
	   sortDirection = value;
	   break;
	 case 'action':
	 case 'name':
	 case 'filter-save':
	   // ignore
	   break;
	 default:
	   // try to find the corresponding input filter box
	   // and select the appropriate 'value'
		 
	   // the keys are unencoded in the sourcecode, we need to re-code them for retrieving the corresponding input box.
	   var prefix = key.substring(7);
	   var encoded = filterEncodeAttribute(prefix);
	   var input = $('#filter-' + encoded);
	   if (input.length > 0) {
		   
		 // we need to take dynamic and well-known filters into consideration:
		 // these tables contain tags with the '::' separator, but this separator is now shown.
		 
		 if (key == 'filter-tags' || key == 'filter-text') {
		   // in the "tags" filter, the full tag is shown (nothing cut off).
		   input.val(value);
		 }
		 else {
		   // does it contain a separator?
		   var a = value.split('::');
		   if (a.length > 1) {
			 // yes it did. use the "value" part to activte the select-box entry.
			 input.val(a[1]);
		   }
		   else {
			 // nope, regular tag
			 input.val(value);
		   }
		 }
	   }
	   break;
	}
  });

  applyFilter();
  return false;
}

function filterEncodeAttribute(id) {
	return Base64.encode(id);
}

function filterDecodeAttribute(id) {
	return Base64.decode(id);
}

/**
 * Filter the issue data with the selected values and set the visible page to 0
 */
function doFilter() {
  currentPage = 0;
  applyFilter();
}

/**
 * The main function for the filter and sort mechanism. It sends an AJAX request to Origo and displays the received content.
 */
function applyFilter() {
  var filterValues = getFilterValues();
  var getString = generateGETString(filterValues);
	  
  // display a progress bar as long as the ajax request is pending
  pb = new Drupal.progressBar("myProgressBar");
  var table = $("#issue_table")[0];
  table.innerHTML = "";
  table.appendChild(pb.element);

  // make an ajax request
  $.get(Drupal.settings.basePath + "ajax/get_issues" + getString, null, function(e) {
    var table = $("#issue_table")[0];
    table.innerHTML = unescape(e);
  });  
}

/**
 * Returns a postfix for an URL with all parameters for filtering and sorting.
 * Example: ?page=0&assignments=user_owner;user_admin&sortcolumn=status
 */
function generateGETString(filterMap) {
  var values = new Array();
  $.each(filterMap, function(key, value) {
	if ((key.length > 0) && (value != null)) {
	  if ((value.length > 0) || (typeof value == 'number')) {
		if (value instanceof Array) {
		  values.push(key + '=' + value.join(","));
		}
		else {
		  values.push(key + '=' + value);
		}
	  }
	}
  });
  
  var result = values.join("&");
  if (result.length > 0)
    result = "?" + result;

  return result;
}


/**
 * Utility function to reset the previous select box.
 * This is used on the issue-tracker main page, to reset input filters.
 */
function resetInput(btn) {
	var button = $('#' + btn.id);
	
	button.parents(".wrapper").find(':input').each(function() {
		switch(this.type) {
			case 'password':
			case 'select-multiple':
			case 'select-one':
			case 'text':
			case 'textarea':
				$(this).val('');
				break;
			case 'checkbox':
			case 'radio':
				this.checked = false;
		}
	});
	
	doFilter();
}

/**
 * Resets the "Save Filter" input box.
 * Note that this is similar to the "resetInput" function, but doesn't trigger re-filtering.
 */
function clearSaveInput(btn) {
	var button = $('#' + btn.id);
	
	button.parents(".wrapper").find(':input').each(function() {
		switch(this.type) {
			case 'password':
			case 'select-multiple':
			case 'select-one':
			case 'text':
			case 'textarea':
				$(this).val('');
				break;
			case 'checkbox':
			case 'radio':
				this.checked = false;
		}
	});
}

/**
 * Utility function to retrieve the currently selected filter values.
 * @return The filter values in a map.
 */
function getFilterValues(forSavingFilters) {
  var allSelects = $('fieldset#filters').find(':input').not(':button');
  
  var filterValues = {};
  allSelects.each(function() {
	var vals = $(this).val();
	if (vals != null) {
	  var css = $(this).attr('class').split(' ');
	  var tagPrefix = '';
	  $.each(css, function(){
	    if (this.indexOf('tag-prefix-') == 0) {
	      tagPrefix = this.substring(11);
	    }
	  });
	
	  
	  if (tagPrefix != '') {
		// prefix each selected value with the prefix
		var prefixed = new Array();

		$.each(vals, function(){
		  prefixed.push(tagPrefix + this);
	    });
		vals = prefixed;
	  }
	  
	  var filterId = this.id;
	  if ((forSavingFilters == true) && (filterId.indexOf('filter-') === 0)) {
		if (!(filterId == 'filter-text' || filterId == 'filter-save')) {
			// when saving personal filters, we need to decode the base64 id (for backwards compatibility)
			var prefix = filterId.substring(7);
			var decoded = filterDecodeAttribute(prefix);
			filterId = 'filter-' + decoded;
		}
	  }
	  if (this.type == "checkbox") {
		  vals= (this.checked) ? "1" : "0";
	  }
	  filterValues[filterId] = vals;
	}
  });
  
  // add page & sorting stuff
  filterValues['page'] = currentPage;
  filterValues['sortcolumn'] = sortColumn;
  filterValues['sortdirection'] = sortDirection;
  
  return filterValues;
}

/**
 * Selects a value from a selection box and refilters the issue list
 */
function selectValue(valueString) {
  var allSelects = $('div#main-filter').find('select');
  
  allSelects.each(function() {
	var targetOption = null;
    var vals = $(this).find('option');
    
    vals.each(function() {
      if($(this).val() == valueString) {
    	targetOption = $(this);
    	return false;
	  }
    });
    
    if (targetOption != null) {
      var currentlySelected = null;
      var selected = $(this).val();
      
      if (selected != null) {
    	  currentlySelected = selected.concat(targetOption.val())
      }
      else {
    	currentlySelected = [targetOption.val()]; 
      }
      
      // set new values
      $(this).val(currentlySelected);
      return false;
    }
  });
  
  doFilter();
  return false;
}
