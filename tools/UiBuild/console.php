#!/usr/bin/env php
<?php

require \dirname(__DIR__, 2).'/vendor/autoload.php';
require __DIR__.'/Kernel.php';

use EasyCorp\Bundle\EasyAdminBundle\Tools\UiBuild\Kernel;
use Symfony\Bundle\FrameworkBundle\Console\Application;

exit((new Application(new Kernel()))->run());
