$('#select-course').bind('change', function(event){
    var selection = $(this).val();
    getChangeList(selection);
});

function alertDismissed(){
    
}

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
    		
            var now = new Date();
    		$('#changeList').append('<li class="data" data-icon="false" style="font-size:12px;"><a href="#" onClick="refresh();">Stand '+
                    now.getDate()+'.'+now.getMonth()+'.'+now.getFullYear()+
                    ', '+now.getHours()+':'+now.getMinutes()+' Uhr. Zum Aktualisieren klicken ...</a></li>');

    		if(changes.length === 0){
    		    $('#changeList').append('<li class="data">'+
    		                            '<h3>Keine Stundenplanänderungen vorhanden!</h3>'+
    		                            '</li>');
    		}
    		
    		$.each(changes, function(index, change) {
    			$('#changeList').append('<li class="data"><h3>' + change.lecture +
    			                              '</h3><p>' + change.course + 
    			                              '</p><p>Alt: ' + change.originaldate +
    			                              '</p><strong>Neu:' + change.alternatedate +
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
    if(option === "null"){
        $('#changeList li.data').remove(); //remove old entries
        $('#changeList').append('<li class="data">'+
                                '<h3>Bitte wähle einen Studiengang!</h3>'+
                                '</li>');
        $('#changeList').listview('refresh');
    }else{
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