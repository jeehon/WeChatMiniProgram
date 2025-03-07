using Azure.AI.OpenAI;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.ClientModel;
using KnowledgeCreationTimeBackend;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using OpenAI;
using OpenAI.Chat;

namespace KnowledgeCreationTimeBackend.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class KCTBackendController : ControllerBase
    {
        private readonly string _endpointBase;
        private readonly string _apiKey;
        private readonly AzureOpenAIClient _azureClient;

        public KCTBackendController(IConfiguration configuration)
        {
            _endpointBase = configuration["AZURE_OPENAI_ENDPOINT"] ?? throw new ArgumentNullException(nameof(configuration), "AZURE_OPENAI_ENDPOINT is not configured.");
            _apiKey = configuration["AZURE_OPENAI_KEY"] ?? throw new ArgumentNullException(nameof(configuration), "AZURE_OPENAI_KEY is not configured.");
            _azureClient = new AzureOpenAIClient(new Uri(_endpointBase), new ApiKeyCredential(_apiKey));
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
                if(type == "Text")
                {
                    var chatClient = _azureClient.GetChatClient("gpt-4o");
                    var response = await chatClient.CompleteChatAsync(content);
                    result.Content = response.Value.Content[0].Text;
                }
                else if (type == "ImageToText")
                {
                    var chatContent = ChatMessageContentPart.CreateImagePart(new Uri(content));
                    var messages = new ChatMessage[]
                    {
                        new UserChatMessage(chatContent),
                        new SystemChatMessage("你是一个专业的图片分析师，请分析链接中图片的内容并且给出最终的场景推测，不要显示分析过程。")
                    };
                    var chatClient = _azureClient.GetChatClient("gpt-4o");
                    
                    var response = await chatClient.CompleteChatAsync(messages);
                    result.Content = response.Value.Content[0].Text;
                }
                else if (type == "TextToImage")
                {
                    var imageClient = _azureClient.GetImageClient("dall-e-3");
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

        private async Task<string> ImageURLToBase64(string imageUrl)
        {
            using (var httpClient = new HttpClient())
            {
                var imageBytes = await httpClient.GetByteArrayAsync(imageUrl);
                return Convert.ToBase64String(imageBytes);
            }
        }
    }
}
