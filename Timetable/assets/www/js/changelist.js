// Wait for PhoneGap to load
//
document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    console.log("Hallo Sven Phonegap is ready!");
    console.log("option: "+window.localStorage.getItem("option"));
    refresh();
}

$('#select-course').bind('change', function(event){
    var selection = $(this).val();
    //window.localStorage.setItem("option", selection);
    getChangeList(selection);
});

function getChangeList(course) {
    $.mobile.showPageLoadingMsg();   
    $('#changeList li.data').remove(); //remove old entries
    
    //check if a network connection exists
    var networkState = navigator.network.connection.type;
    if(networkState === Connection.NONE){
        $('#changeList').append('<li class="data">'+
                '<h3>Keine Internetverbindung vorhanden!</h3>'+
                '<p>Es wird eine Internetverbindung benötigt um die Stundenplanänderungen abzurufen.</p>'+
                '</li>');
        $.mobile.hidePageLoadingMsg();
    }else{
        $.getJSON('http://svenadolph.net/timetable/getchanges.php?course='+course, function(data) {
    		changes = data.items;
    		var currentCourse = null;
    		
			// The whole date crap for the refresh button(line)
            var now = new Date();
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
    	    $.mobile.hidePageLoadingMsg();
    	});
    }
    $('#changeList').listview('refresh');
}

function refresh(){
    var option = $('#select-course').val();    
    var oldOption = window.localStorage.getItem("option");
    if(option === "null"){
        if(oldOption === "null"){        
            $('#changeList li.data').remove(); //remove old entries
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