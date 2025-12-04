 <?php

require 'eco-config.php';

try {
  $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
  $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $stmt = $conn->prepare("SELECT id_producto, nombre, descripcion, unidad_medida, imagen, id_categoria FROM producto");
  $stmt->execute();

  if ( !empty($stmt)) {

    //APERTURA DEL JSON
    echo '"productos": [';
    //echo "Hay registros. <br>";
    while( ($row = $stmt->fetch()) !== false):
      //echo "<a href=https://www.dominio.aaa?ID=".$row['id'].">".$row['id']."</a><br>" ;

      echo '{';

      $Json = '"id_producto": .$row['id'] . ,';
	// echo $row['id'].  " -> ".$row['lastname']."<br>" ;


    endwhile;
  } else {
    echo "No hay registros";
  }
  
  
} catch(PDOException $e) {
  echo "Error: " . $e->getMessage();
}
$conn = null;

?> 