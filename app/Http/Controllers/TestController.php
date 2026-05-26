<?php

namespace App\Http\Controllers;

class TestController extends Controller
{
    public function index($id)
    {
        return "Hello World $id";
    }

    public function new()
    {
        return 'Hello World Redirected';
    }

    public function old()
    {
        return Redirect()->route('new');
    }
}
