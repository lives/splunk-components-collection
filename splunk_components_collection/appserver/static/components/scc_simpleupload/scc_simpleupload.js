/*
	---------------
	SccSimpleupload
	---------------
*/

define(function(require, exports, module) {
    var $ = require('jquery');
	var SimpleSplunkView = require('splunkjs/mvc/simplesplunkview');
	require('./contrib/resumable');
	require("css!./scc_simpleupload.css");
	
    var SccSimpleupload = SimpleSplunkView.extend({
        className: "scc-simpleupload",

        initialize: function() {
			SimpleSplunkView.prototype.initialize.apply(this, arguments);

			return this;
		},

		render: function() {
			this.$el.html('');

			// COMPONENT MAIN HTML "TEMPLATE"
			// ------------------------------
			var main_tpl = '<div class="scc-simpleupload">'
						+		'<div class="files">'
						+			'<div id="uploading">'
						+				'<h3>Uploading</h3>'
						+				'<span class="counter">0</span> files'
						+				'<ul></ul>'
						+			'</div>'
						+			'<div id="uploaded">'
						+				'<h3>Uploaded</h3>'
						+				'<span class="counter">0</span> files'
						+				'<ul></ul>'
						+			'</div>'
						+			'<div id="pending">'
						+				'<h3>Pending</h3>'
						+				'<span class="counter">0</span> files'
						+				'<ul></ul>'
						+			'</div>'
						+		'</div>'
						+		'<button id="browse-btn" class="btn btn-default">Add files</button>'
						+		'<button id="upload-btn" class="btn btn-primary">Upload pending files</button>'
						+	'</div>';
			this.$el.html(main_tpl);

			var $pending = this.$el.find('#pending');
			var $pending_list = $pending.find('ul');
			var $pending_counter = $pending.find('.counter');
			
			var $uploading = this.$el.find('#uploading');
			var $uploading_list = $uploading.find('ul');
			var $uploading_counter = $uploading.find('.counter');
			
			var $uploaded = this.$el.find('#uploaded');
			var $uploaded_list = $uploaded.find('ul');
			var $uploaded_counter = $uploaded.find('.counter');
			
			var $upload_btn = $('#upload-btn');
			var fileProgressStates = {};
			var paused = false;
			
			
			// Create Resumable object
			var r = new Resumable({
				target: Splunk.util.make_url('custom','uploader','upload'),
				query: {'splunk_form_key':Splunk.util.getFormKey()},
				chunkSize: 5*1024*1024
			});
			if(!r.support){
				alert("This app uses Resumable.js but your browser does not support it.\nPlease use a more sensible browser.");
				return;
			}
			r.assignBrowse(this.$el.find('#browse-btn'));
			//r.assignDrop(this.$el.find('#browse'));
			
			
			
			
			
			function updateServerFileList(){
				$.ajax('/custom/uploader/service/list').done(function(files){
					//$uploaded_list.empty();
					//$uploading_list.empty();
					
					//console.log('updateServerFileList');

					$.each(files, function(index, file){

						//console.log(file.uniqueIdentifier);

						
						
						// Upload done
						if(file.finished){
							// 
							//var $file = $('#' + file.uniqueIdentifier);
							
							//console.log(file);
							
							//console.log($uploaded_list.find('#' + file.uniqueIdentifier).length );
							
							//if( $uploaded_list.find('#' + file.uniqueIdentifier).length != 1 ){
								//$uploaded_list.append($file);
								
								
								
								
								var file_tpl = '<li id="' + file.uniqueIdentifier + '" class="file">'
											+		'<div class="details">'
											+			'<div class="splunk-components" style="float: right">'
											+				'<a href="#" class="retry"><span class="icon-rotate"></span></a>'
											+				'<a href="#" class="cancel"><span class="icon-close"></span></a>'
											+			'</div>'
											+			'<div>'
											+				'<span class="name">' + file.fileName + '</span>'
											+				'<span class="size">' + humanFileSize(file.size) + '</span>'
											+			'</div>'
											+		'</div>'
											+		'<div class="progressout">'
											+			'<div class="progress"></div>'
											+		'</div>'
											+		'<div class="speed"></div>'
											+		'<div class="message"></div>'
											+	'</li>'
								
								$uploaded_list.append(file_tpl);
								
								
								$uploaded_counter.html(parseInt($uploaded_counter.html())+1);
							//}
							
							
						}
						// Upload pending
						else{
							/*if(!inArray(uploading_files_indexes, index)){
								uploading_files_indexes.push(index);
								updateCounter($uploading_counter);
							}
							appendFileToList($uploading_list, file);*/
						}
					});
				});
		    }

			var timeinterval = setInterval(function(){
				updateServerFileList();
			}, 1000);

			
			
			
			
			
			
			
			// 
			r.on('fileAdded', function(file){
				//var file_tpl = $('<li data-uniqueid = "' + file.uniqueIdentifier + '">' + file.fileName + ' (' ++ ')</li>');
				
				
				var file_tpl = '<li id="' + file.uniqueIdentifier + '" class="file">'
							+		'<div class="details">'
							+			'<div class="splunk-components" style="float: right">'
							+				'<a href="#" class="retry"><span class="icon-rotate"></span></a>'
							+				'<a href="#" class="cancel"><span class="icon-close"></span></a>'
							+			'</div>'
							+			'<div>'
							+				'<span class="name">' + file.fileName + '</span>'
							+				'<span class="size">' + humanFileSize(file.size) + '</span>'
							+			'</div>'
							+		'</div>'
							+		'<div class="progressout">'
							+			'<div class="progress"></div>'
							+		'</div>'
							+		'<div class="speed"></div>'
							+		'<div class="message"></div>'
							+	'</li>'
				$pending_list.append(file_tpl);
				
				// 
				var $file = $('#' + file.uniqueIdentifier);
				var $file_cancel = $file.find('.cancel');
				var $file_retry = $file.find('.retry')
				
				$file_cancel.on('click', function(){
					file.cancel();
					$file.remove();
					delete file.elm;
					//updateServerFileList();
				});
				
				
				
				$pending_counter.html(parseInt($pending_counter.html())+1);
				
				console.log('aaa');
				
				
				file.$ = $('#' + file.uniqueIdentifier);
				
				
				$(file.$.selector).find('.cancel').show();
				

				
				
				// File added : show upload button if needed
				if($upload_btn.is(':hidden')){
					$upload_btn.show();
				}
				
				
				
				
			})
			r.on('fileSuccess', function(file,message){
				
				var $file = $('#' + file.uniqueIdentifier);
				$uploaded_list.append($file);
				$uploading_list.find($file.attr('id')).remove();
				
				$file.find('.speed').hide();
				$file.find('.progressout').hide();
				
				$uploaded_counter.html(parseInt($uploaded_counter.html())+1);
				$uploading_counter.html(parseInt($uploading_counter.html())-1);
			});
			r.on('fileError', function(file, message){
				var $file = $('#' + file.uniqueIdentifier);
				
				
				var msg = $.parseJSON(message);
				
				$file.find('.message').html(msg.message + ' (error code : ' + msg.errorcode + ')');
			});
				
			r.on('fileProgress', function(file){
				if(file.isComplete()){
					return;
				}
				/*
				var $file = $('#' + file.uniqueIdentifier);
				//file.$.find('.close').show();
				alert('progress');
				//$pending_list.remove($file);
				$uploading_list.append($file);
				
				alert( $file.html() );
*/
				var progress = file.progress();
				var now = (new Date()).getTime();

				var state = fileProgressStates[file.uniqueIdentifier];
				if(!state){
					state = fileProgressStates[file.uniqueIdentifier] = [now, progress];
				}

				var delta = (now - state[0]) / 1000;
				var transffered = file.size * (progress - state[1]);
				var rate = transffered / delta;
				//var left = r.getSize()-(file.size*progress);

				console.log(file);
				
				file.$.find('.speed').text(humanFileSize(rate)+'/s');
				file.$.find('.progress').css({width: Math.round(progress*100)+'%'});
				file.$.addClass('uploading');

				if(delta > 10){
					fileProgressStates[file.uniqueIdentifier] = null;
				}
			});
	
			$upload_btn.on('click', function(){
				// 
				$pending_list.find('li').each(function(index){
					var $li = $(this);
					$uploading_list.append($li);
					$pending_list.find($li.attr('id')).remove();
					
					// 
					$uploading_counter.html(parseInt($uploading_counter.html())+1);
					$pending_counter.html(parseInt($pending_counter.html())-1);
				});
				
				r.upload();
			});
	


			//as found in http://stackoverflow.com/a/14919494
			function humanFileSize(bytes, si) {
				var thresh = si ? 1000 : 1024;
				if(bytes < thresh) return bytes + ' B';
				var units = si ? ['kB','MB','GB','TB','PB','EB','ZB','YB'] : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
				var u = -1;
				do {
					bytes /= thresh;
					++u;
				} while(bytes >= thresh);
				return bytes.toFixed(1)+' '+units[u];
			}

	
/*
				//TODO move these event bindings up the dom/delegate
				var abortBtn = file.elm.find('.btnAbort');
				abortBtn.on('click', function(){
					file.cancel();
					file.elm.remove();
					delete file.elm;
					updateSize();
					updateServerFileList();
				});

				var retryBtn = file.elm.find('.btnRetry');
				retryBtn.on('click', function(){
					file.retry();
					file.elm.removeClass('uploaderror');
					file.elm.find('.message').text('');
					file.elm.find('.btnRetry').hide();
				});

				if(!paused){
					r.upload();
				}

				updateSize();*/
			
			
			
			
			
			/*
			var $uploading_list = this.$el.find('.uploading ul');
			var $uploading_counter = this.$el.find('.uploading .counter');
			var $uploaded_list = this.$el.find('.uploaded ul');
			var $uploaded_counter = this.$el.find('.uploaded .counter');
			var $pending_list = this.$el.find('.pending ul');
			var $pending_counter = this.$el.find('.pending .counter');
			
			
			var uploaded_files_indexes = [];
			var uploading_files_indexes = [];
			
			
			var statusUrl = Splunk.util.make_url('custom','uploader','upload');
			var r = new Resumable({
				target: statusUrl,
				query: {'splunk_form_key':Splunk.util.getFormKey()},
				chunkSize: 5*1024*1024
			});

			if(!r.support){
				alert("This app uses resumable.js but your browser does not support it.\nBefore you continue, please download a more sensible browser.");
				return;
			}
			
			r.assignBrowse(this.$el.find('.browse'));
			r.assignDrop(this.$el.find('.drop-zone'));
			
			
			function updateCounter($counter){
				$counter.html(parseInt($counter.html()) + 1);
			}
			
			function appendFileToList($list, file){	
				
				
				//console.log(file);
				console.log(file.uniqueIdentifier);
				
				// 
				var controls = '<div class="controls" data-file-index="' + file.index + '">';
				if($list == $pending_list){
					controls += '<button class="btn btn-default">upload</button>';
				}
				controls += '</div>';
				
				//
				var file_tpl = '<li class="file">'
						+		'<span class="name">' + file.name + '</span>'
						+		'<span class="size">' + file.size + '</span>'
						+		controls
						+	'</li>';
							
				$list.append(file_tpl);
				//updateCounter($list.find('.counter'), 'up');
			}
			
			function inArray(arr, obj) {
				var result = false
				for(var i=0; i<arr.length; i++) {
					if (arr[i] == obj){
						result = true;
						break;
					}
				}
				return result;
			}

			//as found in http://stackoverflow.com/a/14919494
			function humanFileSize(bytes, si) {
				var thresh = si ? 1000 : 1024;
				if(bytes < thresh) return bytes + ' B';
				var units = si ? ['kB','MB','GB','TB','PB','EB','ZB','YB'] : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
				var u = -1;
				do {
					bytes /= thresh;
					++u;
				} while(bytes >= thresh);
				return bytes.toFixed(1)+' '+units[u];
			}
			
			
			
			function updateServerFileList(){
				$.ajax('/custom/uploader/service/list').done(function(files){
					$uploaded_list.empty();
					$uploading_list.empty();
					
					$.each(files, function(index, file){

						console.log(file.uniqueIdentifier);

						
						// Upload done
						if(file.finished){
							// 
							if(!inArray(uploaded_files_indexes, index)){
								uploaded_files_indexes.push(index);
								updateCounter($uploaded_counter);
							}
							appendFileToList($uploaded_list, file);
						}
						// Upload pending
						else{
							if(!inArray(uploading_files_indexes, index)){
								uploading_files_indexes.push(index);
								updateCounter($uploading_counter);
							}
							appendFileToList($uploading_list, file);
						}
					});
				});
		    }
		
		
		
			updateServerFileList();
			
			r.on('fileAdded', function(file){
				console.log('fileAdded');
				
				file = {
					size: humanFileSize(file.size),
					name: file.fileName
				};
				
				
				var timeinterval = setInterval(function(){
					updateServerFileList();
				}, 1000);	
					
				appendFileToList($pending_list, file);
				updateCounter($pending_counter);
				
				//r.upload();
		
			});
			r.on('fileSuccess', function(file,message){
				console.log('fileSuccess');
			});
			r.on('fileError', function(file, message){
				console.log('fileError');
			});
			*/
            
			

	
	
			
			return this;
		}
	});
	
	return SccSimpleupload;
});
