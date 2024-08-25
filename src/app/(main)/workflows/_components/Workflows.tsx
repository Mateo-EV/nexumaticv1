"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { type WorkFlow } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { useTransitionRouter } from "next-view-transitions";
import { useEffect } from "react";
import { WorkflowDeleteButton } from "./WorkflowDeleteButton";

type WorkflowsProps = {
  initialData: WorkFlow[];
};

export const Workflows = ({ initialData }: WorkflowsProps) => {
  const { data: workflows } = api.workflow.getAllFromUser.useQuery(undefined, {
    initialData,
  });

  if (workflows.length)
    return workflows.map((workflow) => (
      <Workflow workflow={workflow} key={workflow.id} />
    ));

  return (
    <div className="mt-28 flex items-center justify-center text-muted-foreground">
      No Workflows
    </div>
  );
};

type WorkflowProps = {
  workflow: WorkFlow;
};

const handleClickStopPropagation = (e: React.MouseEvent) => {
  e.stopPropagation();
};

const Workflow = ({ workflow }: WorkflowProps) => {
  const router = useTransitionRouter();
  const href = `/workflows/${workflow.id}`;

  useEffect(() => {
    router.prefetch(href);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClickWorkflow = () => {
    const selection = window.getSelection();
    if (selection && selection.type === "Range") {
      return;
    }
    router.push(href);
  };

  return (
    <Card
      className="group flex w-full cursor-pointer items-center justify-between transition-colors hover:bg-secondary/20"
      onClick={handleClickWorkflow}
      style={{ viewTransitionName: `workflow-container-${workflow.id}` }}
    >
      <CardHeader>
        <CardTitle
          className="text-lg"
          style={{ viewTransitionName: `workflow-name-${workflow.id}` }}
        >
          {workflow.name}
        </CardTitle>
        {workflow.description && (
          <CardDescription
            style={{
              viewTransitionName: `workflow-description-${workflow.id}`,
            }}
          >
            {workflow.description}
          </CardDescription>
        )}
        <CardDescription className="font-light italic">
          {workflow.id}
        </CardDescription>
      </CardHeader>
      <div
        className="flex items-center p-4"
        onClick={handleClickStopPropagation}
      >
        <WorkflowDeleteButton workflow={workflow} />
        <Switch id="airplane-mode" className="ml-2" defaultChecked />
      </div>
    </Card>
  );
};