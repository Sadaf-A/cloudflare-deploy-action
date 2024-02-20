import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { getAppId, getInstallationId, getPrivateKey } from "./get-credentials";

// eslint-disable-next-line @typescript-eslint/naming-convention
export function handlePullRequest(owner: string, repo: string, pull_request_number: string, deploymentLink: string, commitSha: string) {
  // printFileStructure("find .").catch(console.error);
  // printFileStructure("find ..").catch(console.error);
  // printFileStructure("find ../..").catch(console.error);

  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: getAppId(),
      privateKey: getPrivateKey(),
      installationId: getInstallationId(),
    },
  });

  const slicedSha = commitSha.slice(0, 7);
  const body = `<div align="right"><a href="${deploymentLink}"><code>${slicedSha}</code></a></div>`;

  // Get all comments
  octokit.issues
    .listComments({
      owner,
      repo,
      issue_number: Number(pull_request_number),
    })
    .then(({ data }) => {
      const botComment = data.find((comment) => comment.user?.login === "ubiquibot[bot]");
      if (botComment) {
        // If bot comment exists, update it
        return octokit.issues.updateComment({
          owner,
          repo,
          comment_id: botComment.id,
          body: botComment.body + "\n" + body,
        });
      } else {
        // If bot comment does not exist, create a new one
        return octokit.pulls.createReview({
          owner,
          repo,
          pull_number: Number(pull_request_number),
          body,
        });
      }
    })
    .catch(console.error);
}
