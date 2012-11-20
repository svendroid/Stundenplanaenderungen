// Wait for PhoneGap to load
//
document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    console.log("Hallo Sven Phonegap is ready!");
    console.log("option: "+window.localStorage.getItem("option"));
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFSSuccess, onError);
    refresh();
}

$('#select-course').bind('change', function(event){
    var selection = $(this).val();
    // window.localStorage.setItem("option", selection);
    getChangeList(selection);
});

function onFSSuccess(fs) {
    fileSystem = fs;
}

function onError(e) {
	alert(e);
}

function getChangeList(course) {
    
	alert("getChangeList: entered");
    
    // check if a network connection exists
    var networkState = navigator.network.connection.type;
    if(networkState === Connection.NONE){
    	alert("getChangeList: No Connection");
        $('#changeList').append('<li class="data">'+
                '<h3>Keine Internetverbindung vorhanden!</h3>'+
                '<p>Es wird eine Internetverbindung benötigt um die Stundenplanänderungen abzurufen.</p>'+
                '</li>');
        $.mobile.hidePageLoadingMsg();
    }else{
    	alert("getChangeList: Got Connection");
        $.getJSON('http://svenadolph.net/timetable/getchanges.php?course='+course, function(data) {
        	alert("getChangeList: Fetched JSON");
    		// Write json to file
            fileSystem.root.getFile("changes.json", {create:true, exclusive: true}, function(fileEntry) {
            	alert("getChangeList: Got File Access");
            	fileEntry.createWriter(function(writer) {
            		alert("getChangeList: Writting File to storage");
            		writer.write(JSON.stringify(data));
            		alert("getChangeList: File written to storage");
            	}, onError());
            }, onError());
    		
    	    $.mobile.hidePageLoadingMsg();
    	}, onError());
    }
    $('#changeList').listview('refresh');
    
    readChangeList(course);
    alert("getChangeList: leaving");
}

function readChangeList(course) {
	alert("readChangeList: Entered");
	$.mobile.showPageLoadingMsg();
	
	// Read JSON from File
	fileSystem.root.getFile("changes.json", null, function(fileEntry) {
    	fileEntry.file(function(file) {
    		
    		var reader = new FileReader();
            reader.onloadend = function(evt) {
                console.log("Read as text");
                console.log(evt.target.result);
            };
            var data = JSON.parse(reader.readAsText(file));
            alert("readChangeList: File read from storage");
            
            $('#changeList li.data').remove(); // remove old entries
            
            changes = data.items;
    		var currentCourse = null;
    		
    		// Read Date from File
    		var now = file.lastModifiedDate;
            var dateString = ('0' + now.getDate()).slice(-2) + '.'
            + ('0' + (now.getMonth()+1)).slice(-2) + '.'
            + now.getFullYear()+', '
            + ('0' + (now.getHours())).slice(-2) + ':'
            + ('0' + (now.getMinutes())).slice(-2) + ' Uhr';
            
    		$('#changeList').append('<li class="data" data-icon="false" style="font-size:12px;"><a href="#" onClick="refresh();">'+
    		        'Stand '+dateString+'. Zum Aktualisieren klicken ...</a></li>');

    		if(changes.length === 0){
    		    $('#changeList').append('<li class="data">'+
    		                            '<h3>Keine Stundenplanänderungen vorhanden!</h3>'+
    		                            '</li>');
    		}
    		
    		// Write all timetable changes to UI
    		$.each(changes, function(index, change) {
    			if(currentCourse !== change.course){
    			    $('#changeList').append('<li class="data" data-role="list-divider">' + change.course +
    			            ' Semester</li>');
    			    currentCourse = change.course;
    			}  
    		    $('#changeList').append('<li class="data"><h3>' + change.lecture +
    			                              '</h3><p>Alt: ' + change.originaldate +
    			                              '</p><strong>Neu: ' + change.alternatedate +
    			                              '</strong></li>');
    		});		
    		$('#changeList').listview('refresh');       
    	}, onError());
    }, getChangeList(course));
    $.mobile.hidePageLoadingMsg();
    $('#changeList').listview('refresh');
    alert("readChangeList: Leaving");
}

function refresh(){
    var option = $('#select-course').val();    
    var oldOption = window.localStorage.getItem("option");
    if(option === "null"){
        if(oldOption === "null"){        
            $('#changeList li.data').remove(); // remove old entries
            $('#changeList').append('<li class="data">'+
                                    '<h3>Bitte wähle einen Studiengang!</h3>'+
                                    '</li>');
            $('#changeList').listview('refresh');
        }else{
            option = oldOption;
            $('#select-course').val(oldOption).trigger('change');
        }
    }else{
        window.localStorage.setItem("option", option);
        getChangeList(option);
    }
}

$('#btn_email').bind('click', function(event) {
    sendEmail("android@svenadolph.net", "Stundenplanänderungs App", "Hallo Sven,\n");
});
$('#btn_twitter').bind('click', function(event) {
    var extras = {};
    extras[WebIntent.EXTRA_TEXT] = "@svendroid #stundenplanaenderungsapp ";
    window.plugins.webintent.startActivity({ 
        action: WebIntent.ACTION_SEND,
        type: 'text/plain', 
        extras: extras 
      }, 
      function() {}, 
      function() {
        alert('Failed to send email via Android Intent');
      }
    );
});

function sendEmail(receiver, subject, body){
    var extras = {};
    extras[WebIntent.EXTRA_EMAIL] = receiver;
    extras[WebIntent.EXTRA_SUBJECT] = subject;
    extras[WebIntent.EXTRA_TEXT] = body;
    
    window.plugins.webintent.startActivity({ 
        action: WebIntent.ACTION_SEND,
        type: 'message/rfc822', 
        extras: extras 
      }, 
      function() {}, 
      function() {
        alert('Failed to send email via Android Intent');
      }
    );
}