if (!window.tinyMceWrapper)
{
//this is tinyMCE delegate
var tinyMceWrapper = {};
var vtbeUtil = {};

tinyMceWrapper.editors = new Hash();
tinyMceWrapper.currentEditorId = null;
tinyMceWrapper.eventRegistered = false;
tinyMceWrapper.bbFPHLst = [];

tinyMceWrapper.Editor = Class.create();

var editors_initialized = false;
}

tinyMceWrapper.Editor.prototype =
{
    initialize : function( fieldName, config, isLegacy, fullScreenMode )
    {
      this._fullScreenMode = fullScreenMode;
      
      //Check if the editor is already present, then remove/destroy the existing editor before creating one. 
      var delayTime = 1.1;
      if ( tinyMceWrapper.editors.get( fieldName ) && !fullScreenMode )
      {
        var edTemp = tinyMceWrapper.editors.get( fieldName )._tinyMceEditor;
        edTemp.remove();
        edTemp.destroy();
        delayTime = 1.5;
      }

      this._isIE = navigator.userAgent.toLowerCase().indexOf( "msie" ) >= 0;
      this._isSafari = navigator.userAgent.toLowerCase().indexOf( "safari" ) >= 0;

      //set to true when the tinyMce is rendered.
      this._tinyMceRendered = false;
      //Call the finalize method after rendering.
      this._callFinalize = false;

      this._toolbarVisible = false;
      this._config = config;
      this._fieldName = fieldName;
      this._isLegacy = isLegacy;
      this._buttonOrders = {};
      this._buttonOrders.simple_buttons = "," + config.theme_advanced_buttons1 + ",";
      this._buttonOrders.full_buttons1 = "," + config.theme_advanced_buttons2 + ",";
      this._buttonOrders.full_buttons2 = "," + config.theme_advanced_buttons3 + ",";
      this._buttonOrders.full_buttons3 = "," + config.theme_advanced_buttons4 + ",";
      this._buttonOrders.full_buttons4 = "," + config.theme_advanced_buttons5 + ",";
      

      this._textArea = $(fieldName);
      //fix LRN-53839 Display horizontal scrollbar in full screen when it is resized.
      if ( !fullScreenMode )
      {
        tinyMceWrapper.editors.set( fieldName, this );
        var fullConfig = this.initializeConfig( config );
        this.createTinyMceEditor.delay( delayTime, fieldName, fullConfig, this );
      }
      else
      {
        tinyMceWrapper.toolBars = ["simple_buttons","full_buttons1","full_buttons2","full_buttons3","full_buttons4"];
        tinyMceWrapper.editors.set( "mce_fullscreen", this );
      }
      // Since we just added something to tinyMceWrapper.editors, reset editors_initialized so we will recreate editors in the next initEditors call
      editors_initialized = false;
      //back-compatiblity

      Element.addMethods(
      {
        getHTML : function( element )
        {
          return element.innerHTML;
        }
      });
    },
    createTinyMceEditor : function( fieldName, fullConfig, tinyMceWrapperEditor )
    {
      tinyMceWrapper.editors.set( fieldName, tinyMceWrapperEditor );
      // Since we just added something to tinyMceWrapper.editors, reset editors_initialized so we will recreate editors in the next initEditors call
      editors_initialized = false;
      tinyMceWrapper.toolBars = ["simple_buttons","full_buttons1","full_buttons2","full_buttons3","full_buttons4"];
      var tinyMceEditor = new tinymce.Editor( fieldName, fullConfig );
      tinyMceEditor.render();
      tinyMceWrapper.editors.get( fieldName )._tinyMceEditor = tinyMceEditor;
      if (window.callbackOnTinyMceEditorCreated && typeof ( window.callbackOnTinyMceEditorCreated ) == "function")
        {
          window.callbackOnTinyMceEditorCreated();
        }
    },
    getTinyMceEditor : function ( )
    {
      return this._tinyMceEditor;
    },
    getButtonOrders : function()
    {
      return this._buttonOrders;
    },
    initializeConfig : function( config )
    {
      var fullConfig = {};
      // default settings
      fullConfig.convert_urls = false;
      fullConfig.mode = "textareas";
      fullConfig.theme = "advanced";
      // for legacy VTBE's, this attribute should be true so that the copied content is the actual value and not the HTML markup
      fullConfig.cleanup = true; //( this._isLegacy === true );
      fullConfig.verify_html = false;
      //fix LRN-54891 as per EPHOX team suggestion.
      fullConfig.extended_valid_elements = "-a[*],#td[colspan|rowspan|width|height|align|valign|bgcolor|background|bordercolor|scope|style|id],#th[colspan|rowspan|width|height|align|valign|scope|style|id]";
      // <font/> being non standard HTML4 element, TinyMCE manipulates the content when it is contained within <pre/> tag that messes
      // up the HTML content. Hence, the workaround to skip that manipulation. See LRN-45716 for details.
      fullConfig.valid_children = "+pre[font]";
      fullConfig.theme_advanced_toolbar_location = "top";
      fullConfig.theme_advanced_toolbar_align = "left";
      fullConfig.theme_advanced_resizing = true;
      fullConfig.theme_advanced_resize_horizontal = false;
      fullConfig.width = "100%";
      fullConfig.font_size_style_values = "xx-small,x-small,small,medium,large,x-large,xx-large";
      fullConfig.theme_advanced_statusbar_location = "bottom";
      fullConfig.paste_retain_style_properties = "all";
      fullConfig.setup = "tinyMceSetup" ;
      fullConfig.apply_source_formatting = true;
      //pass the following settings as objects NOT strings. Suggested by EPHOX.
      fullConfig.powerpaste_word_import = {retain_style_properties: 'valid', strip_class_attributes: 'mso'};
      fullConfig.powerpaste_html_import = {retain_style_properties: 'valid', strip_class_attributes: 'mso'};
      //See LRN-79863, also see EPHOX ticket: https://support.ephox.com/requests/5235
      //By the following setting set to true, it won't allow the browser to insert images with base64 in the text editor.
      fullConfig.powerpaste_strip_base64_images = true;

      var leftAlignFormatStr = "{selector : 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li', styles : {textAlign : 'left'}}," +
                               "{selector : 'img,table', collapsed : false, styles : {'float' : 'left'}}," +
                               "{selector : 'hr', collapsed : false, styles : {textAlign : 'left', marginLeft : '0', marginRight : 'auto'}}";

      if ( config.hasOwnProperty( "directionality" ) && config.directionality == 'rtl' )
      {
        fullConfig.formats = {
                                  alignleft : [ {selector : 'p,h1,h2,h3,h4,h5,h6,td,th,div', styles : {textAlign : 'left'}, defaultBlock: 'div'},
                                                {selector : 'img,table', collapsed : false, styles : {'float' : 'left'}},
                                                {selector : 'hr', collapsed : false, styles : {textAlign : 'left', marginLeft : '0', marginRight : 'auto'}},
                                                {selector: "ul,ol,li", styles : {"text-align" : "left", "list-style-position":"inside"}}],
                                  aligncenter : [
                                                 {selector : 'p,h1,h2,h3,h4,h5,h6,td,th,div', styles : {textAlign : 'center'}, defaultBlock: 'div'},
                                                 {selector : 'img', collapsed : false, styles : {display : 'block', marginLeft : 'auto', marginRight : 'auto'}},
                                                 {selector : 'table', collapsed : false, styles : {marginLeft : 'auto', marginRight : 'auto'}},
                                                 {selector : 'hr', collapsed : false, styles : {textAlign : 'center', marginLeft : 'auto', marginRight : 'auto'}},
                                                 {selector: "ul,ol,li", styles : {"text-align" : "center", "list-style-position":"inside"}}],
                                   alignright : [{selector : 'figure,p,h1,h2,h3,h4,h5,h6,td,th,div', styles : {textAlign : 'right'}, defaultBlock: 'div'},
                                                 {selector : 'img,table', collapsed : false, styles : {'float' : 'right'}},
                                                 {selector : 'hr', collapsed : false, styles : {textAlign : 'right', marginLeft : 'auto', marginRight : '0'}},
                                                 {selector: "ul,ol,li", styles : {"text-align" : "right"}}]
                               };

      }
      else
      {
        fullConfig.formats = {
                                  alignleft : [leftAlignFormatStr],
                                  aligncenter : [
                                                 {selector : 'p,h1,h2,h3,h4,h5,h6,td,th,div', styles : {textAlign : 'center'}, defaultBlock: 'div'},
                                                 {selector : 'img', collapsed : false, styles : {display : 'block', marginLeft : 'auto', marginRight : 'auto'}},
                                                 {selector : 'table', collapsed : false, styles : {marginLeft : 'auto', marginRight : 'auto'}},
                                                 {selector : 'hr', collapsed : false, styles : {textAlign : 'center', marginLeft : 'auto', marginRight : 'auto'}},
                                                 {selector: "ul,ol,li", styles : {"text-align" : "center", "list-style-position":"inside"}}],
                                  alignright : [{selector : 'figure,p,h1,h2,h3,h4,h5,h6,td,th,div', styles : {textAlign : 'right'}, defaultBlock: 'div'},
                                               {selector : 'img,table', collapsed : false, styles : {'float' : 'right'}},
                                               {selector : 'hr', collapsed : false, styles : {textAlign : 'right', marginLeft : 'auto', marginRight : '0'}},
                                               {selector: "ul,ol,li", styles : {"text-align" : "right", "list-style-position":"inside"}}]
                               };
      }
      for(var setting in config )
      {
        if ( config.hasOwnProperty( setting ) )
        {
          fullConfig[setting] = config[setting];
        }
      }
      return fullConfig;
    },
    setupForFullScreen : function ( editorId )
    {
      var tw = tinyMceWrapper.editors.get( editorId ) ;
      if ( tw )
      {
        tw.getTinyMceEditor().remove();
      }
      new tinyMceWrapper.Editor( this._fieldName, this._config, this._isLegacy, true );
    },
    finalizeEditor : function()
    {
      if ( this._tinyMceRendered )
      {
        // checked the bug, it still exists in all browsers, so we need the fix.
        try
        {
          var content = this._tinyMceEditor.getContent().trim();
          var newContent = BrowserSpecific.handleFirefoxPastedLinksBug( this._tinyMceEditor.documentBaseURI.getURI(),
                                                                        content );
          if ( newContent != content )
          {
            this._tinyMceEditor.setContent( newContent );
          }
          this._tinyMceEditor.save();
        }
        catch ( e )
        {
          // ignore
        }
      }
      else
      {
        // Call this method after the tinyMce is Rendered
        this._callFinalize = true;
      }
    },
    focusEditor : function()
    {
      this._tinyMceEditor.focus();
    },
    setupToolbar : function( ed )
    {
      ed.onPostRender.add( function( editor, cm )
      {
        // This is called from tinyMce Editor
        tinyMceWrapper.editors.get( editor.editorId ).registryEvent( editor );
      } );
    },
    registryEvent: function ( editor )
    {
      this._tinyMceRendered = true;
      var em = $( editor.editorId + "_ifr" );
      if ( !tinyMceWrapper.eventRegistered )
      {
        Event.observe( window.document, 'mousedown', this.handleWindowClick.bindAsEventListener( this ) );
        Event.observe( window.document, 'keydown', this.handleWindowClick.bindAsEventListener( this ) );
        tinyMceWrapper.eventRegistered = true;
      }

      if ( this._isIE ) //For IE need to add click and focus for the iFrame
      {
        Event.observe( em, 'click', this.handleFocus.bindAsEventListener( this ) );
      }
      if ( em.contentDocument )
      {
        if ( this._isSafari )
        {
          Event.observe( em.contentDocument, 'click', this.handleFocus.bindAsEventListener( this ) );
        }
        else
        {
          Event.observe( em.contentDocument, 'focus', this.handleFocus.bindAsEventListener( this ) );
        }
      }
      //Sometime registerOnChangeCallback is called before the render is done. So it is a hack to fix this issue.
      if ( this._onChangeExtraFun )
      {
        this._onChangeExtraValue = this._onChangeExtraFun( $( editor.editorId + "_ifr" ) );
      }

      //Calling the finalize method
      if ( this._callFinalize === true )
      {
        this.finalizeEditor();
      }
      //Calling the finalize method when the window is unloaded
      tinymce.dom.Event.add( editor.getWin(), 'unload', function( e )
      {
        if ( tinyMceWrapper.editors.get( editor.editorId ) &&  tinyMceWrapper.editors.get( editor.editorId ) !== null )
        {
          tinyMceWrapper.editors.get( editor.editorId ).finalizeEditor();
          tinyMceWrapper.editors.get( editor.editorId )._tinyMceRendered = false;
        }
      } );
    },
    finalizeEditorsAnyChange : function( callback )
    {
      var orig = this._textArea.value.trim();
      this.finalizeEditor();
      var mod = this._textArea.value.trim();
      if ( orig != mod )
      {
        // Special case where we start out with nothing but the vtbe is adding a &nbsp; on us... ignore it.
        if ( !( orig === '' && mod == '&nbsp;' ) )
        {
          if ( typeof ( callback ) == "function" )
          {
            callback( $( this._fieldName + "_ifr" ) );
          }
        }
      }
    },
    registerOnChangeCallback : function( callback, extraCallback )
    {
      this._onChangeCallback = callback;
      this._onChangeExtraFun = extraCallback;
      //Sometime this method is called before the tinyMce is rendered. So checking if the tinyMce is rendered.
      if ( $( this._fieldName + "_ifr" ) !== null && this._onChangeExtraFun)
      {
        this._onChangeExtraValue = this._onChangeExtraFun( $( this._fieldName + "_ifr" ) );
      }
      this._tinyMceEditor.onKeyUp.add( function( editor, e, callback, extraCallback )
      {
        var tinyMceWrapper = window.tinyMceWrapper.editors.get( editor.editorId );
        if ( tinyMceWrapper._onChangeCallback !== null )
        {
          tinyMceWrapper.finalizeEditor();
          tinyMceWrapper._onChangeCallback( $( editor.editorId + "_ifr" ), tinyMceWrapper._onChangeExtraValue );
        }
      } );
    },
    handleWindowClick : function ( event )
    {
      if ( tinyMceWrapper.currentEditorId === null || !tinyMceWrapper.editors.get( tinyMceWrapper.currentEditorId ) )
      {
         return;
      }
      var el = event.element();
      if ( el === null )
      {
        return;
      }
      var className = el.className ;
      if ( typeof(className) !== "undefined" && className !== null && className.indexOf( "mce" ) == -1 )
      {
        // For legacy VTBE's, we need to explicitly call finalizeEditor to copy the contents to textarea element.
        if ( this._isLegacy === true )
        {
          //Finalize Editor for the current editor
          tinyMceWrapper.editors.get( tinyMceWrapper.currentEditorId ).finalizeEditor();
        }
      }
    },
    handleFocus : function( e )
    {
      this.focusEditor();
      tinyMceWrapper.currentEditorId = this._fieldName;
      this._textArea.previousElementSibling.style.display="block"; //display VTBE help text
    },
    destory : function ()
    {
      this.destroyEditor();
    },
    destroyEditor : function ()
    {
      if ( tinyMceWrapper.editors.get( this._fieldName ) )
      {
        tinyMceWrapper.editors.unset( this._fieldName );
        // Since we just removed something from tinyMceWrapper.editors, reset editors_initialized so we will recreate editors in the next initEditors call
        editors_initialized = false;
      }
      if ( tinyMceWrapper.currentEditorId == this._fieldName )
      {
        tinyMceWrapper.currentEditorId = null;
      }
    },
    /* Called from the pickers to insert HTML*/
    insertHTML : function ( html )
    {
      tinyMCE.execCommand('mceInsertContent', false,  html );
    },
    replaceHTML : function( html )
    {
      //sometimes this methoed is called before tinymce is rendered.
      // so setting the value to filed first.
      // fix race condition in chrome and safari browsers.
      $( this._fieldName ).value = html;
      if ( this._tinyMceRendered )
      {
        this._tinyMceEditor.setContent( html );
      }
    },
    /* back compatibility */
    regenerateIframe : function( html )
    {
      this.replaceHTML(html);
    },
    getHTML : function()
    {
      return this.getTinyMceEditor().getContent();
    }

};

tinyMceWrapper.getEditor = function( fieldName )
{
  return tinyMceWrapper.editors.get( fieldName );
};

tinyMceWrapper.getEditorIdFromIframe = function( vtbeIFrame )
{
  var vtbeIFrameId = vtbeIFrame.id;
  var editorId = vtbeIFrameId.substr( 0, vtbeIFrameId.indexOf( "_ifr" ) );
  return editorId;
};

/*Called when the mashup code */
tinyMceWrapper.setMashupData = function( htmlToInsert )
{
  tinyMCE.execCommand('mceInsertContent', false,  htmlToInsert.replace(/<div(\b[^>]*)>\s*?<!--([\w\W]*?)-->\s*?<\/div>/gi, "<div$1><!--$2-->&nbsp;<\/div>") );
};

tinyMceWrapper.restoreMes = function( editorId, text )
{
  tinyMceWrapper.editors.get( editorId ).replaceHTML( text );
};

// back compatibility
function finalizeEditors()
{
  var execCommandArgs = {skip_focus: true};
  tinyMceWrapper.editors.each( function( pair )
  {
    // When submitting page, remove Spell Check Markup before finalizing each editor's content.
    // Executing the command "clearSpellCheckMarkUp" should occur here rather than in finalizeEditor() because
    // finalizeEditor() is called every time there is a click within the window while finalizeEditors() is only called when the page is submitted.
    if ( pair.value._tinyMceEditor && pair.value._tinyMceRendered )
    {
      pair.value._tinyMceEditor.execCommand('clearSpellCheckMarkUp', null, null, execCommandArgs);
    }

    pair.value.finalizeEditor();
  } );
}

function finalizeEditorsAnyChange( callback )
{
  tinyMceWrapper.editors.each( function( pair )
  {
    pair.value.finalizeEditorsAnyChange( callback );
  } );
}

// This method will setup an onchange callback for all vtbe editors on the page.
// The extraCallback method is optional.  If passed it will be called with the
// iframe of each editor and is expected to return something to pass to the
// callback method on each change.  This is an optimization step to make each
// call to the callback faster as it won't have to figure out which vtbe on the
// page it is for its onchange purposes (see assessment.js, .jsp for details)
// The callback method will be called on each change within the vtbe with two
// parameters: the iframe of the editor and anything returned by the extracallback
// for the editor being changed
function registerOnChangeCallback( callback, extraCallback )
{
  tinyMceWrapper.editors.each( function( pair )
  {
    pair.value.registerOnChangeCallback( callback, extraCallback );
  } );
}

function initEditors()
{
  if ( !editors_initialized )
  {
    editors = tinyMceWrapper.editors.toObject();
    editors_initialized = true;
  }
}

function tinyMceSetup( editor )
{
  try
  {
    var tw = tinyMceWrapper.editors.get( editor.editorId );
    tw._tinyMceEditor = editor;
    this._fieldName = editor.editorId;
    //fix LRN-53839 Display horizontal scrollbar in full screen when it is resized.
    if ( tw._fullScreenMode ) {
      editor.settings.theme_advanced_resize_horizontal = true;
    }
    tw.setupToolbar( editor );
  }
  catch ( e )
  {
    //ignore
  }
}

/**
 * This called to display the lightbox, which will have a VTBE in it.
 *
 * @param content           The content to be displayed in the VTBE
 * @param title             The title of the Light Box
 * @param vtbeLightboxUrl   The Lightbox url
 * @param callback          The function to call back after the light box is submitted
 * @param callbackParams    Extra parameters that need to be send back while calling the "callback" function
 * @param isSpellcheckOnly  Specify if the vtbe to be displayed should be spell check only
 * @param reuseLightbox     If we need to reuse the lightbox, and not open it each time.
 *
 * @return if the lightbox was already exists or not
 */
vtbeUtil.lightBox = function( content, title, vtbeLightboxUrl, callback, callbackParams, isSpellcheckOnly, reuseLightbox )
{
  var openLightBox = ( reuseLightbox === null || reuseLightbox === false ); //Do not reuse the lightbox

  //If we need to openLightbox, if the current lightbox is not found and editor with contenttext not found we need to open the lightbox
  if ( openLightBox || lightbox.getCurrentLightbox() === null  )
  {
    var lightboxParam =
    {
        defaultDimensions :
        {
            w : 1000,
            h : 300
        },
        ajax :
        {
            url : vtbeLightboxUrl,
            method : 'post',
            asyn : false,
            params :
            {
              content : content,
              callback : callback,
              callbackParams : Object.toJSON( callbackParams ),
              isSpellcheckOnly : isSpellcheckOnly,
              reuseLightbox : !openLightBox
            },
            loadExternalScripts : true
        },
        title : title,
        closeOnBodyClick : false,
        showCloseLink : false,
        contents : content,
        useDefaultDimensionsAsMinimumSize : true
    };
    var lightboxInstance = new lightbox.Lightbox( lightboxParam );
    lightboxInstance.open();
    return false;
  }
  else
  {
    lightbox.getCurrentLightbox().show();
    return true;
  }
};

vtbeUtil.removeAllEditors = function()
{
  var vtbeNames = [];
  tinymce.editors.each( function( e )
  {
    vtbeNames.push( e.id );
  } );
  vtbeNames.each( function( s )
  {
    tinymce.get( s ).remove();
  } );
};
