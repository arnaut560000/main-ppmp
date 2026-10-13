<?php

return [
    // Match the React resolver's exact directory casing on Linux and Windows.
    'page_paths' => [resource_path('js/pages')],
    'page_extensions' => ['tsx'],
    'ensure_pages_exist' => true,

    'testing' => [
        'ensure_pages_exist' => true,
        'page_paths' => [resource_path('js/pages')],
        'page_extensions' => ['tsx'],
    ],
];
