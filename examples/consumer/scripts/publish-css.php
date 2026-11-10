<?php

$projectDir = \dirname(__DIR__);
$compiled = $projectDir.'/var/tailwind/consumer.built.css';
if (!is_file($compiled)) {
    throw new RuntimeException('Run the application Tailwind build before publishing its stylesheet.');
}
copy($compiled, $projectDir.'/assets/styles/consumer-utilities.css');
