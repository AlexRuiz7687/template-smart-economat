<?php
if (extension_loaded('gd') && function_exists('gd_info')) {
    echo "GD library is INSTALLED.";
    print_r(gd_info());
} else {
    echo "GD library is NOT installed.";
}
?>
