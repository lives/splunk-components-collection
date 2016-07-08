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

			// GENERATE COMPONENT MAIN HTML
			// ----------------------------
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

			var $pending_list = $('#pending ul');
			var $uploading_list = $('#uploading ul');
			var $uploaded_list = $('#uploaded ul');

			var $upload_btn = $('#upload-btn');
			//var fileProgressStates = {};
			//var paused = false;

			
			// 
			$uploaded_list.on('click', function(e){
				var $target = $(e.target);
				
				// Btn close -> delete file
				if($target.hasClass('icon-close')){
					var $file = $target.closest('.file');
					var file_name = $file.attr('data-file-name');

					if(confirm('Are you sure you want to delete '+ file_name)){
						$.ajax('/custom/splunk_components_collection/scc_simpleupload_service/remove/'+ file_name).done(function(){
							$file.remove();
						}).error(function(){
							alert('There was an error while deleting. Check web_service.log for more info.');
						});
					}
				}
			});
			
			// 
			$pending_list.on('click', function(e){
				var $target = $(e.target);

				// Btn close -> delete file
				if($target.hasClass('icon-close')){
					removeFileFromList($pending_list, $target.closest('.file').index());
				}
			});
			
			// 
			$uploading_list.on('click', function(e){
				var $target = $(e.target);

				// Btn close -> delete file
				if($target.hasClass('icon-close')){
					removeFileFromList($uploading_list, $target.closest('.file').index());
				}
			});
			
			// 
			$upload_btn.on('click', function(e){
				
				var $list = $pending_list.find('li')
				
				$list.each(function(file_index){
					addFileToList($uploading_list, $(this));
					emptyFileList($pending_list);
				});
				
				
				r.upload();
			});
			
			
			

			// RESUMABLE.JS STUFF
			// ------------------
			var r = new Resumable({
				target: Splunk.util.make_url('custom','splunk_components_collection','scc_simpleupload_upload'),
				query: {'splunk_form_key':Splunk.util.getFormKey()},
				chunkSize: 5*1024*1024
			});
			if(!r.support){
				alert("This app uses Resumable.js but your browser does not support it.\nPlease use a more sensible browser.");
				return;
			}
			r.assignBrowse(this.$el.find('#browse-btn'));
			
			// Add file
			// --------
			r.on('fileAdded', function(file){
				//
				var $file = generateFileListElement(file);
				addFileToList($pending_list, $file);
				
				if($upload_btn.is(':hidden')){
					$upload_btn.show();
				}
			});
			
			// Upload in progress
			// ------------------
			r.on('fileProgress', function(file){
				
			});
			
			// Upload success
			// --------------
			r.on('fileSuccess', function(file, message){
				addFileToList($uploaded_list, $('#' + file.uniqueIdentifier));
			});
			
			// Upload Error
			// ------------
			r.on('fileError', function(file, message){
				var file_msg = '';
				var msg = JSON.parse(message);
				if(parseInt(msg.errorcode) > 0 && typeof(msg.message) != 'undefined'){
					file_msg = 'Upload Failed.\n ' + msg.message + ' (error code ' + msg.errorcode + ')';
				}
				else{
					file_msg = 'Upload Failed.\n Please check Splunk web_service.log for error details.';
				}

				$uploading_list.find('#' + file.uniqueIdentifier + ' .message').text(file_msg);
			});
			
			
			
			
			
			
			
			
			
			
			
			
			
			// 
			function addFileToList($list, $file){
				$list.append($file);
				
				var $counter = $list.closest('div').find('.counter');
				$counter.html(parseInt($counter.html())+1);
			}
			
			// 
			function removeFileFromList($list, file_index){
				$list.find('li').eq(file_index).remove();
				
				var $counter = $list.closest('div').find('.counter');
				$counter.html(parseInt($counter.html())-1);
			}
			
			function emptyFileList($list){
				$list.empty();
				$list.closest('div').find('.counter').html(0);
			}
			
			
			// 
			function generateFileListElement(file){
				var html_id = typeof file.uniqueIdentifier != 'undefined' ?  ' id="' + file.uniqueIdentifier + '"' : '';
				var file_name = typeof file.name != 'undefined' ? file.name : file.fileName;
				
				var file_tpl = '<li' + html_id + ' class="file" data-file-name="' + file_name + '">'
							+		'<div class="details">'
							+			'<div class="splunk-components" style="float: right">'
							+				'<a href="#" class="retry"><span class="icon-rotate"></span></a>'
							+				'<a href="#"><span class="icon-close"></span></a>'
							+			'</div>'
							+			'<div>'
							+				'<span class="name">' + file_name + '</span>'
							+				'<span class="size">' + humanFileSize(file.size) + '</span>'
							+			'</div>'
							+		'</div>'
							+		'<div class="progressout">'
							+			'<div class="progress"></div>'
							+		'</div>'
							+		'<div class="speed"></div>'
							+		'<div class="message"></div>'
							+	'</li>';
							
				return file_tpl;
			}
			
			// 
			function humanFileSize(bytes, si) {
				// See http://stackoverflow.com/a/14919494
				var thresh = si ? 1000 : 1024;
				if(bytes < thresh){
					return bytes + ' B';
				}
				
				var units = si ? ['kB','MB','GB','TB','PB','EB','ZB','YB'] : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
				var u = -1;
				do {
					bytes /= thresh;
					++u;
				}
				while(bytes >= thresh);
				
				return bytes.toFixed(1)+' '+units[u];
			}
			
			
			// 
			function getServerFiles(){
				$.ajax('/custom/splunk_components_collection/scc_simpleupload_service/list').done(function(files){
					$.each(files, function(index, file){

						if(file.finished){
							var $file = generateFileListElement(file);
							addFileToList($uploaded_list, $file);
						}

					});

				});
		    }
			
			
			
			
			getServerFiles();
			
			
			return this;
		}
	});
	
	return SccSimpleupload;
});
