<?php

use App\Models\CategoriaLanding;
use App\Models\SubcategoriaLanding;

echo "Checking CategoriaLanding...\n";
$cats = CategoriaLanding::all();
echo "Total Categories: " . $cats->count() . "\n";

foreach ($cats as $cat) {
    echo "Category: {$cat->nombre} (ID: {$cat->id})\n";
    $subs = SubcategoriaLanding::where('categoria_id', $cat->id)->get();
    echo "  Total Subcategories: " . $subs->count() . "\n";
    
    $shown = $subs->where('mostrar_en_navbar', true);
    echo "  Shown in Navbar: " . $shown->count() . "\n";
}
