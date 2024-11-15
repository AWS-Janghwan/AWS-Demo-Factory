import React from 'react';
import { useParams } from 'react-router-dom';
import ReactPlayer from 'react-player';
import MDEditor from '@uiw/react-md-editor';

const DemoPage = () => {
  const { id } = useParams();
  
  // Replace with your actual S3 video URL
  const demoData = {
    videoUrl: 'https://aws-demo-factory.s3.us-west-2.amazonaws.com/aws-demo.mp4?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEKb%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQChjxqWPqxleIOV912AW7xaKdIRnyg%2FRl2O03nI7GAJjwIgP9jvzX6H13Jv8Zz3%2FzNMbS46bYRhnCZH3txPMcriZTUq0QMI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgwxMTgzMzc0ODEzODkiDCXCEI%2BC9Bv5FqADeyqlA5dCHmw0MIhe065s5HmrLddgZqhHkoaNureNfebsnKiECqBLuQ1BLstfZZHchwnCIokRRBT%2FPASKNYeLripywF%2FN6AzPISgsymuTrg64Rm2QXM7d3EXIX7GynV8mSZvGKZlXXZVNe5lu4WSRinAri%2FBSVDG0mlCXORX2q5CWvjZS9bepmZhJqwrkypVdGjI5Lof9sHH%2F%2FdVawT024aheS3WfUGmU50uJw0WOxGhsoMIY3XJMHaWTno7ZYSYJO2U24go16bP8m0VXax%2BU8FI9F%2FzD5rZBGznbX6HNKjYOPQteukQ%2Blar4K9%2BPNLP%2FMamTtqokR7EdBOMpKjqxN%2F2fO9NSdPR8hOxVpNV9iOb94HukJLDZKaVlP3%2BIp%2BVvnO6ZIGt1m%2Bueqc0PiXWvi%2F2NCgRiWz9wftW%2BmnLatiSJqND2uEraNrhsZqJ2mTbclny4Q%2BuqOpfpj08IHVg7mmGThhkcJIyOCaahL48bTd8Db1oYZqim112OvhIyTZ0sScLejSehCduqGlRf%2Bqd29DdAnlYX2IW20RBCJseFPDOGujbtTnFfs3Yw%2Fqi9uAY6lAJIbsB%2FY5paK%2BmLn1HveDT3iW7nUXggV9k02DeYfD2w3aJuyFI3%2FiHT%2B08Z1BeS0IQtfCuaN0dbuy44AsENZAJ7jpXLYKpcECp3GqwGsf%2FfumB2qmXYyuz9oYFSfHQq%2FXHfSX3Ou5PDk%2BzvXsHSA%2FvNrFuPrXshYRBNttTYRHGvTXAAMmWQ9j8ztEq722%2BIXplzD4QoOA1IDSA6GDbxi5BYA06xQRgCs8Pl1T6arJEdpmCFrGnzQAU4%2BmhdguQS7vLx0g8%2B%2FQsr9tu76tupZliEmLTIqfBUU0ZJDq8LpN%2FdMdJAsRTsxLj0vhwpqvXPrYOum8MCByeH4iNC9AL6YTa2j3BXT5G%2B7tvRjxdzwhwHccRsOuw%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20241016T055703Z&X-Amz-SignedHeaders=host&X-Amz-Expires=43199&X-Amz-Credential=ASIARXDLWVKWY5ZIZMYX%2F20241016%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Signature=9f522454fffa2f98fb86a703caf6af6f156092d825326c146b2b73b3b0b917d0',
    architectureMarkdown: '# Architecture\n![Architecture](https://via.placeholder.com/150)',
    codeMarkdown: '# Code\n```javascript\nconsole.log("Hello World");\n```'
  };

  return (
    <div>
      <h1>Demo {id}</h1>
      <ReactPlayer url={demoData.videoUrl} controls width="800px" height="450px" />
      <MDEditor.Markdown source={demoData.architectureMarkdown} />
      <MDEditor.Markdown source={demoData.codeMarkdown} />
    </div>
  );
};

export default DemoPage;