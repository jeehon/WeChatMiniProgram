using Azure.AI.OpenAI;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.ClientModel;
using KnowledgeCreationTimeBackend;
using Microsoft.AspNetCore.Mvc.ViewFeatures;

namespace KnowledgeCreationTimeBackend.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class KCTBackendController : ControllerBase
    {
        private readonly string _endpointBase;
        private readonly string _apiKey;

        public KCTBackendController(IConfiguration configuration)
        {
            _endpointBase = configuration["AZURE_OPENAI_ENDPOINT"] ?? throw new ArgumentNullException(nameof(configuration), "AZURE_OPENAI_ENDPOINT is not configured.");
            _apiKey = configuration["AZURE_OPENAI_KEY"] ?? throw new ArgumentNullException(nameof(configuration), "AZURE_OPENAI_KEY is not configured.");
        }

        [HttpPost]
        public async Task<AIContent> Post([FromBody] AIInput input)
        {
            var type = input.Type;
            var content = input.Content;
            var result = new AIContent();
            if (string.IsNullOrEmpty(type) || string.IsNullOrEmpty(content))
            {
                result.Content = "Type and content are required.";
            }
            try
            {
                var azureClient = new AzureOpenAIClient(new Uri(_endpointBase), new ApiKeyCredential(_apiKey));
                if(type == "Text")
                {
                    var chatClient = azureClient.GetChatClient("gpt-4o");
                    var response = await chatClient.CompleteChatAsync(content);
                    result.Content = response.Value.Content[0].Text;
                }
                else if (type == "Image")
                {
                    var imageClient = azureClient.GetImageClient("gpt-4o");
                    var response = await imageClient.GenerateImageAsync(content);
                    result.Content = response.Value.ImageUri.AbsoluteUri;
                }

                return result;
            }
            catch (Exception ex)
            {
                result.Content = ex.Message;
                return result;
            }
        }
    }
}
