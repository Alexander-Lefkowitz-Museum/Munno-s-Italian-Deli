<!DOCTYPE html>

<html>
<head>
    <meta charset="utf-8">
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <title>Munno's Italian Deli</title>
    <meta name="description" content="">
    <link rel="stylesheet" type="text/css" href="assets/css/main.css">

<style>
body,footer {
	background:white !important;
}
button {
	display:none !important;
}
.locationInfo {
    float: right;
    font-weight: bold;
    margin: 0 0 26px;
    width: 29%;
}
#printableOrder {
    margin: 0 0 26px 80px;
    width: 65%;
    font-family: sans-serif;
}
#contain {
	box-shadow: 0 0 5px rgba(0, 0, 0, 0.91);
}
.center {
	text-align: center;
}
#orderPrice{
	font-size:24px;
}
</style>
</head>

<body>
<div id="contain">
	<header>
	     <h1 class="title"><span>Munno's</span> Italian Deli</h1>
	     <h3>Catering For All Occastions <span>845-735-9405</span><h3>
	     <h4>Phone: (845) 735-9405 / (845) 735-1547<br>
	     	 Fax (845) 735-9408</h4>
	</header>
	<h2 class="center">Thank you for your order!</h2>
	<h3 class="center">Present or fax this to us.</h3>
	<div class="locationInfo">
	51 East Central Ave,<br>
	Pearl River, NY 10965
	</div>
	<div id="printableOrder">
	<strong>Order:</strong>
<?php

echo stripslashes($_POST["munnoOrder"]);

?>
	</div>
	<footer>
	    Munno's Italian Deli :: Phone: (845) 735-9405 / (845) 735-1547
	</footer>
</div>
<script type="text/javascript" src="assets/scripts/jquery-1.9.1.min.js"></script>

<script>
var holdValue;
document.getElementById("orderButton").outerHTML ="";
$("input").each(function () {
	holdValue = this.value;
	this.parentNode.innerHTML = this.value +" X " + this.parentNode.innerHTML;
})
$(".close").remove();
$("input").remove();
window.print()
</script>
</body>
</html>