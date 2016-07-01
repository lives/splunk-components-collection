require([
	"jquery",
	"splunkjs/mvc",
	"splunkjs/mvc/utils",
	"splunkjs/mvc/simplexml/ready!"
	
], function($, mvc, utils) {
	var service = mvc.createService();
	var properties = service.configurations({'owner':service.owner, 'app':service.app});
	
	service.serverInfo(function(err, info){
		var a_full_splunk_version = info.properties().version.split('.');

		try{
			properties.get("scc_fronturlrouter/routes_" + a_full_splunk_version[0] + '.' + a_full_splunk_version[1] + "/")
			// Found
			.done(function(response){
				var routes = JSON.parse(response).entry;

				for(var i= 0; i < routes.length; i++){
					var requested_page = utils.getPageInfo().page;
					
					if(routes[i].name == requested_page){
						var redirected_page = routes[i].content;

						// Get settings
						properties.get("scc_fronturlrouter/modal_settings/")
						.done(function(response){
							var raw_settings = JSON.parse(response).entry;
							var settings = {};
							
							for(var i= 0; i < raw_settings.length; i++){
								settings[raw_settings[i].name] = raw_settings[i].content;
							}

							// 
							function doRedirection(new_page){
								window.location.href = new_page;
							}

							if(settings.show_modal == 'true'){
								settings.modal_title = typeof(settings.modal_title) == 'undefined' ?  utils.getCurrentApp() + ' message :' : settings.modal_title;
								settings.modal_msg = typeof(settings.modal_msg) == 'undefined' ? 'A redirection will occur.' : settings.modal_msg;
								settings.modal_lifetime = typeof(settings.modal_lifetime) == 'undefined' ? 5 : settings.modal_lifetime;
								
								var html_modal = '<div class="modal fade" id="fto-customurlrouter-modal" tabindex="-1" aria-labelledby="fto-customurlrouter-modal" role="dialog">'
												+	'<div class="modal-dialog">'
												+		'<div class="modal-content">'
												+			'<div class="modal-header">'
												+				'<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'
												+				'<h4 class="modal-title">' + settings.modal_title + '</h4>'
												+			'</div>'
												+			'<div class="modal-body">'
												+				'<p>' + settings.modal_msg + '</p>'
												+			'</div>'
												+			'<div class="modal-footer">'
												+				'<span class="fto-modal-lifetime">' + settings.modal_lifetime + '</span>'
												+			'</div>'
												+		'</div>'
												+	'</div>'
												+'</div>';
	
								$('body').append(html_modal);
								var $modal = $('body').find('#fto-customurlrouter-modal');
								$modal
								.modal('show')
								.on('shown.bs.modal', function(e){
									// 
									var timeinterval = setInterval(function(){
										settings.modal_lifetime --;
										
										if(settings.modal_lifetime == 0){
											clearInterval(timeinterval);
											doRedirection(redirected_page);
										}
										else{
											$('.fto-modal-lifetime').html(settings.modal_lifetime);
										}
									},1000);
								});
							}
							else{
								doRedirection(redirected_page);
							}
						});

						break;
					}
				}	
			});
		}
		catch(e){}
	});
});