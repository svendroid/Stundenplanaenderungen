// Wait for PhoneGap to load
//
var message = "nix";
var currChange = null;

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    console.log("Hallo Sven Phonegap is ready!");
    console.log("option: " + window.localStorage.getItem("option"));
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFSSuccess, onError);
    refresh();
}

$('#select-course').bind('change', function (event) {
    var selection = $(this).val();
    // window.localStorage.setItem("option", selection);
    getChangeList(selection);
});

function onFSSuccess(fs) {
    fileSystem = fs;
}

function onError(error) {
	console.log('ERROR');
}

function getChangeList(course) {
    
	$.mobile.showPageLoadingMsg();
    // check if a network connection exists
    var networkState = navigator.network.connection.type;
    if (networkState === Connection.NONE) {
        console.log("getChangeList: No Connection");
        $('#changeList').append('<li class="data">' +
                '<h3>Keine Internetverbindung vorhanden!</h3>' +
                '<p>Es wird eine Internetverbindung benötigt um die Stundenplanänderungen abzurufen.</p>' +
                '</li>');
        $.mobile.hidePageLoadingMsg();
    } else {
        $.getJSON('http://svenadolph.net/timetable/getchanges.php?course=' + course, function (data) {
            // Write json to file
            fileSystem.root.getFile("changes.json", {create: true, exclusive: false}, function (fileEntry) {
                console.log("getChangeList: Got File Access");
                fileEntry.createWriter(function (writer) {
                    console.log("getChangeList: Writting File to storage");
                    writer.write(JSON.stringify(data));
                    console.log("getChangeList: File written to storage");
                });
            });

            readChangeList(course);
        }, onError());
    }
    $('#changeList').listview('refresh');
}

function readChangeList(course) {
	$.mobile.showPageLoadingMsg();
	
	// Read JSON from File
	fileSystem.root.getFile("changes.json", null, function (fileEntry) {
        fileEntry.file(function (file) {
            var reader = new FileReader();
            reader.onloadend = function (evt) {
                var data = JSON.parse(evt.target.result);
                
                $('#changeList li.data').remove(); // remove old entries

                changes = data.items;
                
                // Read Date from File
                var now = new Date(file.lastModifiedDate),
                    dateString = ('0' + now.getDate()).slice(-2) + '.'
                + ('0' + (now.getMonth() + 1)).slice(-2) + '.'
                + now.getFullYear() + ', '
                + ('0' + (now.getHours())).slice(-2) + ':'
                + ('0' + (now.getMinutes())).slice(-2) + ' Uhr';
                
                $('#changeList').append('<li class="data" data-icon="false" style="font-size:12px;"><a href="#" onClick="refresh();">' +
                        'Stand ' + dateString + '. Zum Aktualisieren klicken ...</a></li>');

                if (changes.length === 0) {
                    $('#changeList').append('<li class="data">' +
                                            '<h3>Keine Stundenplanänderungen vorhanden!</h3>' +
                                            '</li>');
                }
                
                // $('#changeList').append(JSON.stringify(changes));

                // Write all timetable changes to UI
                //current Course is the current semster e.g. MI2, MI4, MI6
                var currentCourse = null;
                $.each(changes, function (index, change) {
                    if (currentCourse !== change.course) {
                        $('#changeList').append('<li class="data" data-role="list-divider">' + change.course +
                            ' Semester</li>');
                        currentCourse = change.course;
                    }
                    $('#changeList').append('<li class="data"><a href="#share" data-role="button" data-rel="dialog"><h3>' + change.lecture +
                                                   '</h3><p>Alt: ' + change.originaldate +
                                                   '</p><strong>Neu: ' + change.alternatedate +
                                                   '</strong></a></li>');
                    message = change.lecture + "\n Alt: " + change.originaldate + "\n Neu: " + change.alternatedate;
                    currChange = change;

                });
                $('#changeList').listview('refresh');
                $.mobile.hidePageLoadingMsg();
            };
            reader.readAsText(file);

        }, onError);
    }, onError);
    // $('#changeList').listview('refresh');
}

function refresh() {
    var option = $('#select-course').val();    
    var oldOption = window.localStorage.getItem("option");
    if (option === "null") {
        if (oldOption === "null") {        
            $('#changeList li.data').remove(); // remove old entries
            $('#changeList').append('<li class="data">' +
                                    '<h3>Bitte wähle einen Studiengang!</h3>' +
                                    '</li>');
            $('#changeList').listview('refresh');
        } else {
            option = oldOption;
            $('#select-course').val(oldOption).trigger('change');
        }
    } else {
        window.localStorage.setItem("option", option);
        getChangeList(option);
    }
}

$('#btn_share').bind('click', function (event) {
    shareMsg();
});

$('#btn_cal').bind('click', function (event) {
    addToCalendar();
});


$('#btn_email').bind('click', function (event) {
    sendEmail("android@svenadolph.net", "Stundenplanänderungs App", "Hallo Sven,\n");
});

$('#btn_twitter').bind('click', function (event) {
    var extras = {};
    extras[WebIntent.EXTRA_TEXT] = "@svendroid #stundenplanaenderungsapp ";
    window.plugins.webintent.startActivity({ 
        action: WebIntent.ACTION_SEND,
        type: 'text/plain', 
        extras: extras 
        }, 
        function () {}, 
        function () {
            console.log('Failed to share on twitter via Android Intent');
        }
    );
});

function shareMsg(){
   var extras = {};
    extras[WebIntent.EXTRA_TEXT] = message;
    window.plugins.webintent.startActivity({ 
        action: WebIntent.ACTION_SEND,
        type: 'text/plain', 
        extras: extras 
        }, 
        function () {}, 
        function () {
            console.log('Failed to share appointment via Android Intent');
        }
    ); 
}

function addToCalendar() {
    var extras = {};
    extras.title = currChange.lecture;
    extras.description = message;
    
    window.plugins.webintent.startActivity({ 
        action: WebIntent.ACTION_EDIT,
        type: 'vnd.android.cursor.item/event', 
        extras: extras 
      }, 
      function () {}, 
      function () {
        console.log('Failed to add new entry via Android Intent');
      }
    );
}

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
      function () {}, 
      function () {
        console.log('Failed to send email via Android Intent');
      }
    );
}