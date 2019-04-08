import * as Path from 'path';

import { DeclarationReflection, ProjectReflection } from '../../models/reflections/index';
import { Component, RendererComponent } from '../components';
import { writeFile } from '../../utils/fs';
import { RendererEvent } from '../events';

/**
 * A plugin that exports an index of the project to a javascript file.
 *
 * The resulting javascript file can be used to build a simple search function.
 */
@Component({name: 'javascript-index'})
export class JavascriptIndexPlugin extends RendererComponent {
    /**
     * Create a new JavascriptIndexPlugin instance.
     */
    initialize() {
        this.listenTo(this.owner, RendererEvent.BEGIN, this.onRendererBegin);
    }

    /**
     * Triggered after a document has been rendered, just before it is written to disc.
     *
     * @param event  An event object describing the current render operation.
     */
    private onRendererBegin(event: RendererEvent) {
        const rows: any[] = [];

        for (let key in event.project.reflections) {
            const reflection: DeclarationReflection = <DeclarationReflection> event.project.reflections[key];
            if (!(reflection instanceof DeclarationReflection)) {
                continue;
            }

            if (!reflection.url ||
                !reflection.name ||
                reflection.flags.isExternal ||
                reflection.name === '') {
                continue;
            }

            let parent = reflection.parent;
            if (parent instanceof ProjectReflection) {
                parent = undefined;
            }

            const row: any = {
                id: rows.length,
                kind: reflection.kind,
                fullName: reflection.name,
                url: reflection.url,
                classes: reflection.cssClasses
            };

            if (parent) {
                row.parent = parent.getFullName();
                row.fullName = `${row.parent}.${reflection.name}`;
            }

            rows.push(row);
        }

        const fileName = Path.join(event.outputDirectory, 'assets', 'js', 'search.js');
        const data =
            `/* Copyright (C) 1998-2019 by Northwoods Software Corporation. All Rights Reserved. */
            var typedoc = typedoc || {};
            typedoc.search = typedoc.search || {};
            typedoc.search.data = ${JSON.stringify(rows)};`;

        writeFile(fileName, data, false);
    }
}
