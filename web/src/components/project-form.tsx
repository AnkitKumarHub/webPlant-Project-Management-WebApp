"use client";

import { useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { errorFields, errorMessage } from "@/lib/errors";
import type { Project } from "@/lib/types";
import { useCreateProjectMutation, useUpdateProjectMutation } from "@/store/api";

export function ProjectForm({
  project,
  onDone,
  onCancel,
}: {
  project?: Project;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const [createProject, createState] = useCreateProjectMutation();
  const [updateProject, updateState] = useUpdateProjectMutation();
  const { isLoading, error } = project ? updateState : createState;

  const [title, setTitle] = useState(project?.title ?? "");
  const [description, setDescription] = useState(project?.description ?? "");

  const fields = errorFields(error);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = project
      ? await updateProject({ id: project.id, patch: { title, description } })
      : await createProject({ title, description });

    if ("data" in result) {
      if (!project) {
        setTitle("");
        setDescription("");
      }
      onDone?.();
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate>
          <FieldGroup>
            {error && Object.keys(fields).length === 0 ? (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage(error)}</AlertDescription>
              </Alert>
            ) : null}

            <Field data-invalid={Boolean(fields["title"])}>
              <FieldLabel htmlFor="project-title">Title</FieldLabel>
              <Input
                id="project-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Website redesign"
                aria-invalid={Boolean(fields["title"])}
                required
              />
              <FieldError>{fields["title"]}</FieldError>
            </Field>

            <Field data-invalid={Boolean(fields["description"])}>
              <FieldLabel htmlFor="project-description">Description</FieldLabel>
              <Textarea
                id="project-description"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What is this project for?"
                aria-invalid={Boolean(fields["description"])}
              />
              {fields["description"] ? (
                <FieldError>{fields["description"]}</FieldError>
              ) : (
                <FieldDescription>Optional.</FieldDescription>
              )}
            </Field>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Spinner data-icon="inline-start" /> : null}
                {isLoading ? "Saving…" : project ? "Save changes" : "Create project"}
              </Button>
              {onCancel ? (
                <Button type="button" variant="ghost" onClick={onCancel}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
