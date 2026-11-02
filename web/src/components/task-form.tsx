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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { errorFields, errorMessage } from "@/lib/errors";
import { toDateInputValue } from "@/lib/format";
import { TASK_STATUSES, TASK_STATUS_LABELS, type Task, type TaskStatus } from "@/lib/types";
import { useCreateTaskMutation, useUpdateTaskMutation } from "@/store/api";

export function TaskForm({
  projectId,
  task,
  onDone,
  onCancel,
  embedded = false,
}: {
  projectId: string;
  task?: Task;
  onDone?: () => void;
  onCancel?: () => void;
  /** Skip the Card wrapper when rendered inside a Dialog. */
  embedded?: boolean;
}) {
  const [createTask, createState] = useCreateTaskMutation();
  const [updateTask, updateState] = useUpdateTaskMutation();
  const { isLoading, error } = task ? updateState : createState;

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "todo");
  const [dueDate, setDueDate] = useState(toDateInputValue(task?.dueDate ?? null));

  const fields = errorFields(error);
  const idPrefix = task ? `task-${task.id}` : "new-task";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      title,
      description,
      status,
      dueDate: dueDate === "" ? null : dueDate,
    };

    const result = task
      ? await updateTask({ id: task.id, projectId, patch: payload })
      : await createTask({ projectId, ...payload });

    if ("data" in result) {
      if (!task) {
        setTitle("");
        setDescription("");
        setStatus("todo");
        setDueDate("");
      }
      onDone?.();
    }
  }

  const form = (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        {error && Object.keys(fields).length === 0 ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage(error)}</AlertDescription>
          </Alert>
        ) : null}

        <Field data-invalid={Boolean(fields["title"])}>
          <FieldLabel htmlFor={`${idPrefix}-title`}>Title</FieldLabel>
          <Input
            id={`${idPrefix}-title`}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Draft the new homepage copy"
            aria-invalid={Boolean(fields["title"])}
            required
          />
          <FieldError>{fields["title"]}</FieldError>
        </Field>

        <Field data-invalid={Boolean(fields["description"])}>
          <FieldLabel htmlFor={`${idPrefix}-description`}>Description</FieldLabel>
          <Textarea
            id={`${idPrefix}-description`}
            rows={2}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            aria-invalid={Boolean(fields["description"])}
          />
          {fields["description"] ? (
            <FieldError>{fields["description"]}</FieldError>
          ) : (
            <FieldDescription>Optional.</FieldDescription>
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(fields["status"])}>
            <FieldLabel htmlFor={`${idPrefix}-status`}>Status</FieldLabel>
            <Select
              items={TASK_STATUS_LABELS}
              value={status}
              onValueChange={(value) => {
                if (value) setStatus(value as TaskStatus);
              }}
            >
              <SelectTrigger id={`${idPrefix}-status`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {TASK_STATUS_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{fields["status"]}</FieldError>
          </Field>

          <Field data-invalid={Boolean(fields["dueDate"])}>
            <FieldLabel htmlFor={`${idPrefix}-due`}>Due date</FieldLabel>
            <Input
              id={`${idPrefix}-due`}
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              aria-invalid={Boolean(fields["dueDate"])}
            />
            {fields["dueDate"] ? (
              <FieldError>{fields["dueDate"]}</FieldError>
            ) : (
              <FieldDescription>Optional.</FieldDescription>
            )}
          </Field>
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Spinner data-icon="inline-start" /> : null}
            {isLoading ? "Saving…" : task ? "Save changes" : "Add task"}
          </Button>
          {onCancel ? (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      </FieldGroup>
    </form>
  );

  if (embedded) {
    return form;
  }

  return (
    <Card>
      <CardContent>{form}</CardContent>
    </Card>
  );
}
