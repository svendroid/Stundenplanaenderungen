<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
$oldSetting = libxml_use_internal_errors( true );
libxml_clear_errors();

//get course parameter
$courseParam = $_GET['course']; 
//no validation of valid parameter is done
if(!isset($courseParam)){
	$courseParam = "TD";
}

//check if it is a valid course	
	$html = new DOMDocument();
	$html->loadHtmlFile( 'http://www.hof-university.de/alle-aktuellen-aenderungen.883.0.html' );
	$xpath = new DOMXPath( $html );

	//get all <tr>-tags which own a <td>-tag with the class-attribute "class"
	$elements = $xpath->query('//tr/td[@class="data"]/..');
	if (!is_null($elements)) {
		$timetablechanges = array(); //result list - contains all changes	
		foreach ($elements as $element) {
			$td_elements = $xpath->query('td', $element);//select the <td>-tags of the row
			$course = $td_elements->item(0)->nodeValue;
			if(preg_match("/".$courseParam."/", $course)){ //check for the right course				
				$change = array("course" => $td_elements->item(0)->nodeValue,
								"lecture" => $td_elements->item(1)->nodeValue,
								"originaldate" => $td_elements->item(2)->nodeValue,
								"alternatedate" => $td_elements->item(3)->nodeValue);
				$change["lecture"] = str_replace(" -- -", " ", $change["lecture"]);//replace senseless characters
				$change["lecture"] = str_replace("---", "-", $change["lecture"]);//replace senseless characters
				$change["lecture"] = str_replace("--", "-", $change["lecture"]);//replace senseless characters
				$change["originaldate"] = preg_replace("/^(.{10})/", "$1 ", $change["originaldate"]);//enter a space after 10th character		
				$change["alternatedate"] = preg_replace("/^(.{10})/", "$1 ", $change["alternatedate"]);//enter a space after 10th character
				//echo $change["originaldate"];
				$timetablechanges[] = $change; //add change to the result list
				usort($timetablechanges, "cmp");
			}
		}
	  echo '{"items": ' . json_encode($timetablechanges) . '}';//output the result formated as string
	}
	libxml_clear_errors();
	libxml_use_internal_errors( $oldSetting );

function cmp($a, $b)
{
    return strcmp($a["course"], $b["course"]);
}
?>