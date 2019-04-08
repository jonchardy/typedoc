import * as ts from 'typescript';

import { Reflection, ReflectionKind } from '../../models/index';
import { createComment, createDeclaration, createSignature } from '../factories/index';
import { Context } from '../context';
import { Component, ConverterNodeComponent } from '../components';

@Component({name: 'node:accessor'})
export class AccessorConverter extends ConverterNodeComponent<ts.SignatureDeclaration> {
    /**
     * List of supported TypeScript syntax kinds.
     */
    supports: ts.SyntaxKind[] = [
        ts.SyntaxKind.GetAccessor,
        ts.SyntaxKind.SetAccessor
    ];

    /**
     * Analyze the given getter declaration node and create a suitable reflection.
     *
     * @param context  The context object describing the current state the converter is in.
     * @param node     The signature declaration node that should be analyzed.
     * @return The resulting reflection or NULL.
     */
    convert(context: Context, node: ts.SignatureDeclaration): Reflection | undefined {
        // CUSTOM: Need to handle @constant accessors (PanelLayout)
        const comment = createComment(node);
        const scope = context.scope;
        let kind = ReflectionKind.Accessor;
        if (scope.kind & ReflectionKind.ClassOrInterface) {
            if (comment && comment.hasTag('constant')) {
                kind = ReflectionKind.Constant;
            }
        }
        const declaration = createDeclaration(context, node, kind);

        context.withScope(declaration, () => {
            if (kind === ReflectionKind.Constant) {
                declaration!.type = this.owner.convertType(context, node.type, context.getTypeAtLocation(node));
            } else {
                if (node.kind === ts.SyntaxKind.GetAccessor) {
                    declaration!.getSignature = createSignature(context, node, '__get', ReflectionKind.GetSignature);
                } else {
                    declaration!.setSignature = createSignature(context, node, '__set', ReflectionKind.SetSignature);
                }
            }
        });

        return declaration;
    }
}
