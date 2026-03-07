import { WorkflowConverter } from "@/components/WorkflowConverter";

const WorkflowConverterPage = () => {
  const handleWorkflowConverted = (workflow: any) => {
    console.log('Workflow converted:', workflow);
    // You can add additional logic here, like storing the converted workflow
    // or navigating to a demo page
  };

  return <WorkflowConverter onWorkflowConverted={handleWorkflowConverted} />;
};

export default WorkflowConverterPage;
