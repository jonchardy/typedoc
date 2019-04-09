import { Reflection, DefaultValueContainer, TypeContainer, TypeParameterContainer, TraverseCallback, TraverseProperty } from './abstract';
import { Type, ReflectionType, ReferenceType } from '../types/index';
import { ContainerReflection } from './container';
import { SignatureReflection } from './signature';
import { TypeParameterReflection } from './type-parameter';

/**
 * Stores hierarchical type data.
 *
 * @see [[DeclarationReflection.typeHierarchy]]
 */
export interface DeclarationHierarchy {
    /**
     * The types represented by this node in the hierarchy.
     */
    types: Type[];

    /**
     * The next hierarchy level.
     */
    next?: DeclarationHierarchy;

    /**
     * Is this the entry containing the target type?
     */
    isTarget?: boolean;
}

/**
 * A reflection that represents a single declaration emitted by the TypeScript compiler.
 *
 * All parts of a project are represented by DeclarationReflection instances. The actual
 * kind of a reflection is stored in its ´kind´ member.
 */
export class DeclarationReflection extends ContainerReflection implements DefaultValueContainer, TypeContainer, TypeParameterContainer {
    /**
     * The type of the reflection.
     *
     * If the reflection represents a variable or a property, this is the value type.<br />
     * If the reflection represents a signature, this is the return type.
     */
    type?: Type;

    typeParameters?: TypeParameterReflection[];

    /**
     * A list of call signatures attached to this declaration.
     *
     * TypeDoc creates one declaration per function that may contain ore or more
     * signature reflections.
     */
    signatures?: SignatureReflection[];

    /**
     * The index signature of this declaration.
     */
    indexSignature?: SignatureReflection;

    /**
     * The get signature of this declaration.
     */
    getSignature?: SignatureReflection;

    /**
     * The set signature of this declaration.
     */
    setSignature?: SignatureReflection;

    /**
     * The default value of this reflection.
     *
     * Applies to function parameters.
     */
    defaultValue?: string;

    /**
     * A type that points to the reflection that has been overwritten by this reflection.
     *
     * Applies to interface and class members.
     */
    overwrites?: Type;

    /**
     * A type that points to the reflection this reflection has been inherited from.
     *
     * Applies to interface and class members.
     */
    inheritedFrom?: Type;

    /**
     * A type that points to the reflection this reflection is the implementation of.
     *
     * Applies to class members.
     */
    implementationOf?: Type;

    /**
     * A list of all types this reflection extends (e.g. the parent classes).
     */
    extendedTypes?: Type[];

    /**
     * A list of all types that extend this reflection (e.g. the subclasses).
     */
    extendedBy?: Type[];

    /**
     * A list of all types this reflection implements.
     */
    implementedTypes?: Type[];

    /**
     * A list of all types that implement this reflection.
     */
    implementedBy?: Type[];

    /**
     * Contains a simplified representation of the type hierarchy suitable for being
     * rendered in templates.
     */
    typeHierarchy?: DeclarationHierarchy;

    hasGetterOrSetter(): boolean {
        return !!this.getSignature || !!this.setSignature;
    }

    getAllSignatures(): SignatureReflection[] {
        let result: SignatureReflection[] = [];

        if (this.signatures) {
            result = result.concat(this.signatures);
        }
        if (this.indexSignature) {
            result.push(this.indexSignature);
        }
        if (this.getSignature) {
            result.push(this.getSignature);
        }
        if (this.setSignature) {
            result.push(this.setSignature);
        }

        return result;
    }

    /**
     * @param name  The name to look for. Might contain a hierarchy.
     */
    findReflectionByName(name: string, searchUp?: boolean): Reflection;

    /**
     * @param names  The name hierarchy to look for.
     */
    findReflectionByName(names: string[], searchUp?: boolean): Reflection;

    /**
     * Try to find a reflection by its name.
     * For DeclarationReflections, walk up the parent type tree looking for the reflection.
     *
     * @return The found reflection or null.
     */
    findReflectionByName(arg: any, searchUp?: boolean): Reflection | undefined {
        const names: string[] = Array.isArray(arg) ? arg : arg.split('.');

        function walkTypeParents(child: DeclarationReflection) {
            let parents = child.extendedTypes;
            if (parents) {
                let firstParent = parents[0] as ReferenceType;
                let parentReflection = firstParent.reflection as DeclarationReflection;
                if (parentReflection) {
                    const ref = parentReflection.findReflectionByName(names, searchUp);
                    if (ref) {
                        return ref;
                    }
                }
            }
            return null;
        }

        const reflection = this.getChildByName(names);
        if (reflection) {
            return reflection;
        } else {
            if (searchUp && this.extendedTypes) {
                const inheritedReflection = walkTypeParents(this);
                if (inheritedReflection !== null) {
                    return inheritedReflection;
                }
            }
            if (this.parent) {
                const ref = this.parent.findReflectionByName(names);
                if (ref) {
                    return ref;
                }
            }
        }
    }

    /**
     * Traverse all potential child reflections of this reflection.
     *
     * The given callback will be invoked for all children, signatures and type parameters
     * attached to this reflection.
     *
     * @param callback  The callback function that should be applied for each child reflection.
     */
    traverse(callback: TraverseCallback) {
        if (this.typeParameters) {
            this.typeParameters.slice().forEach((parameter) => callback(parameter, TraverseProperty.TypeParameter));
        }

        if (this.type instanceof ReflectionType) {
            callback(this.type.declaration, TraverseProperty.TypeLiteral);
        }

        if (this.signatures) {
            this.signatures.slice().forEach((signature) => callback(signature, TraverseProperty.Signatures));
        }

        if (this.indexSignature) {
            callback(this.indexSignature, TraverseProperty.IndexSignature);
        }

        if (this.getSignature) {
            callback(this.getSignature, TraverseProperty.GetSignature);
        }

        if (this.setSignature) {
            callback(this.setSignature, TraverseProperty.SetSignature);
        }

        super.traverse(callback);
    }

    /**
     * Return a raw object representation of this reflection.
     * @deprecated Use serializers instead
     */
    toObject(): any {
        let result = super.toObject();

        if (this.type) {
            result.type = this.type.toObject();
        }

        if (this.defaultValue) {
            result.defaultValue = this.defaultValue;
        }

        if (this.overwrites) {
            result.overwrites = this.overwrites.toObject();
        }

        if (this.inheritedFrom) {
            result.inheritedFrom = this.inheritedFrom.toObject();
        }

        if (this.extendedTypes) {
            result.extendedTypes = this.extendedTypes.map((t) => t.toObject());
        }

        if (this.extendedBy) {
            result.extendedBy = this.extendedBy.map((t) => t.toObject());
        }

        if (this.implementedTypes) {
            result.implementedTypes = this.implementedTypes.map((t) => t.toObject());
        }

        if (this.implementedBy) {
            result.implementedBy = this.implementedBy.map((t) => t.toObject());
        }

        if (this.implementationOf) {
            result.implementationOf = this.implementationOf.toObject();
        }

        return result;
    }

    /**
     * Return a string representation of this reflection.
     */
    toString(): string {
        let result = super.toString();

        if (this.typeParameters) {
            const parameters: string[] = [];
            this.typeParameters.forEach((parameter) => {
                parameters.push(parameter.name);
            });
            result += '<' + parameters.join(', ') + '>';
        }

        if (this.type) {
            result += ':' + this.type.toString();
        }

        return result;
    }
}
