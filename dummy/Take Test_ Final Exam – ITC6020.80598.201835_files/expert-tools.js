eesy.define(['jquery-private', 'sessionInfo', 'utils', 'expert-context-definer', 'json!language-cms'], 
    function($, sessionInfo, utils, contextDefiner, language) {
  /*
   * Private functions
   */
  function showMenu() {
    $('#contact-menu').css({'opacity' : '1', 'visibility' : 'visible'});
    $('#expert-tool-btn').css({'opacity' : '0', 'visibility' : 'hidden'});
  }
  function hideMenu() {
    $('#contact-menu').css({'opacity' : '0', 'visibility' : 'hidden'});
    $('#expert-tool-btn').css({'opacity' : '1', 'visibility' : 'visible'});
  }
  /*
   * Public functions
   */
  function show() {
    $.get(var_dashboard_url + "/resources/mustache/cms/expert_tool.html",
        function(template_expert_tool) {

      $('body').append(Mustache.to_html(template_expert_tool, 
          {dashboardurl: sessionInfo.dashboardUrl, LNG: language.LNG}));
      
      utils.onClickOrSelectKey('#expert-tool-btn', showMenu);
      utils.onClickOrSelectKey('#expert-tool-btn-hide', hideMenu);
      
      utils.onClickOrSelectKey('#expert-define-context', function() {
        hideMenu();
        contextDefiner.show(); 
      });
      
    });
  }
  
  return {
    show: show
  };
});
