eesy.define(['jquery-private', 'sessionInfo', 'utils', 'json!language-cms'], 
    function($, sessionInfo, utils, language) {
  /*
   * Private functions
   */
  function closeExpertTool() {
    $('#eesy-capture-dialog').fadeOut(function() {
      $('#eesy-capture-dialog').remove();
    });
  }
  
  function checkFormStatus(callback) {
    if($("#contextname").val() == "") {
      callback({
        valid: false,
        reason: language.LNG.CMS.IN_APP.CAPTURE_PAGE.CONTEXT_NAME.INVALID,
        target: $("#contextname")
      });
      return;
    }
    
    callback({valid: true});
  }
  
  function addPageContext(e) {
    $(".form__error").remove();
    checkFormStatus(function (formStatus) {
      if(!formStatus.valid) {
        $(formStatus.target)
        .parent()
        .append('<div class="form__error" style="display: block;">' + formStatus.reason + '</div>');
      } else {
        var params = [];
        $('.capture-param').each(function(i, obj) {
          if($j_eesy(obj).prop("checked")) {
            params.push($j_eesy(obj).data("capture-param"));
          }
        });
        
        var postObj = {
          contextName: $j_eesy("#contextname").val(),
          host: $j_eesy("#checkbox-host").prop("checked") 
            ? $j_eesy("#checkbox-host").data("capture-host")
            : "",
          path: $j_eesy("#checkbox-path").prop("checked") 
            ? $j_eesy("#checkbox-path").data("capture-path")
            : "",
          parameters: params  
        };

        $.post(var_dashboard_url + "/rest/expert/contextrules?sessionkey=" + var_key, postObj, function() {
          closeExpertTool();
        });
      }
    });
    e.preventDefault();
  }
  /*
   * Public functions
   */
  function openCaptureDefinerForm() {
    $.get(var_dashboard_url + "/resources/mustache/cms/expert_tool_dialog_capture_page.html",
        function(template_capture_page) {
      
      utils.onClickOrSelectKey('.header__close', closeExpertTool);
      utils.onClickOrSelectKey('#add-page-context', addPageContext);

      
      var params = window.location.search.split("&");

      params = $.grep(params,function(n){ return n.length; });
      if (params.length) {
        params[0] = params[0].substr(1);
      }
      
      for (var i=0; i<params.length; i++) {
        params[i] = { value: params[i], id: 'param-' + i };
      }

      $('body').append(Mustache.to_html(template_capture_page, {
        host: window.location.host, 
        path: window.location.pathname, 
        params: params,
        LNG: language.LNG
      }));
    });
  }
  
  return {
    show: openCaptureDefinerForm
  };
});
